import asyncio
import json
import os
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import Optional

from backend.app.services.subtitle_service import SubtitleService
from backend.app.services.thumbnail_service import ThumbnailService

_subtitle_svc = SubtitleService()
_thumbnail_svc = ThumbnailService()


class VideoService:
    TARGET_WIDTH = 1080
    TARGET_HEIGHT = 1920
    MAX_DURATION = 60

    COLOR_PRESETS = {
        "original": {},
        "vivid": {
            "brightness": 0.05,
            "contrast": 1.2,
            "saturation": 1.4,
        },
        "cinematic": {
            "brightness": -0.05,
            "contrast": 1.15,
            "saturation": 0.8,
            "gamma": 0.95,
        },
        "warm": {
            "brightness": 0.03,
            "contrast": 1.1,
            "saturation": 1.1,
            "gamma_r": 1.15,
            "gamma_b": 0.88,
        },
        "cold": {
            "brightness": 0.02,
            "contrast": 1.1,
            "saturation": 1.0,
            "gamma_r": 0.88,
            "gamma_b": 1.15,
        },
        "vsco": {
            "brightness": 0.06,
            "contrast": 1.05,
            "saturation": 0.88,
            "gamma": 1.05,
        },
        "dark": {
            "brightness": -0.1,
            "contrast": 1.25,
            "saturation": 1.1,
        },
    }

    def __init__(self):
        self.upload_dir = Path("uploads")
        self.output_dir = Path("outputs")
        self.upload_dir.mkdir(exist_ok=True)
        self.output_dir.mkdir(exist_ok=True)
        self.jobs: dict = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def process_video(self, input_path: str, settings: dict) -> str:
        """
        Verarbeitet ein Video mit allen aktivierten Features.

        Feature-Flags in settings (alle True by default):
          enable_crop       - 9:16 Auto-Crop
          enable_color      - Farbkorrektur
          enable_speed      - Geschwindigkeitsanpassung
          enable_subtitles  - Automatische Untertitel (Whisper)
          enable_thumbnail  - Thumbnail generieren
          enable_title_text - Titeltext-Overlay
          enable_subtitle_text - Untertitel-Text-Overlay (Handle etc.)

        Multi-Clip:
          clips: [[start1, end1], [start2, end2], ...]  (optional)
          Wenn leer → trim_start/trim_end wird verwendet
        """
        job_id = uuid.uuid4().hex[:8]
        self.jobs[job_id] = {"status": "processing"}

        try:
            clips = self._parse_clips(settings, input_path)

            if len(clips) > 1:
                output_path = await self._process_multi_clip(
                    input_path, clips, settings, job_id
                )
            else:
                start, end = clips[0]
                settings = {**settings, "trim_start": start, "trim_end": end}
                output_path = await self._process_single_clip(
                    input_path, settings, job_id
                )

            # Thumbnail
            thumb_path = None
            if settings.get("enable_thumbnail", True):
                try:
                    thumb_path = _thumbnail_svc.generate(
                        str(output_path),
                        color_preset=settings.get("color_preset", "original"),
                        title_text=settings.get("title_text", "")
                        if settings.get("enable_title_text", True) else "",
                        job_id=job_id,
                    )
                except Exception:
                    pass  # Thumbnail-Fehler sind nicht kritisch

            self.jobs[job_id] = {
                "status": "done",
                "output_path": str(output_path),
                "filename": Path(output_path).name,
                "thumbnail_path": thumb_path,
                "thumbnail_filename": Path(thumb_path).name if thumb_path else None,
            }
            return job_id

        except Exception as exc:
            self.jobs[job_id] = {"status": "error", "error": str(exc)}
            raise

    def get_job(self, job_id: str) -> dict:
        return self.jobs.get(job_id, {"status": "not_found"})

    def get_video_info(self, path: str) -> dict:
        probe = self._probe(path)
        video_stream = next(
            (s for s in probe["streams"] if s["codec_type"] == "video"), {}
        )
        return {
            "duration": float(probe["format"].get("duration", 0)),
            "width": int(video_stream.get("width", 0)),
            "height": int(video_stream.get("height", 0)),
            "has_audio": any(s["codec_type"] == "audio" for s in probe["streams"]),
        }

    # ------------------------------------------------------------------
    # Single-Clip Processing
    # ------------------------------------------------------------------

    async def _process_single_clip(
        self, input_path: str, settings: dict, job_id: str
    ) -> str:
        output_path = self.output_dir / f"tiktok_{job_id}.mp4"

        # Subtitel transkribieren BEVOR ffmpeg läuft (brauchen Input-Audio)
        subs_path = None
        if settings.get("enable_subtitles", True) and _subtitle_svc.is_available():
            try:
                trim_start = float(settings.get("trim_start", 0))
                trim_end = float(settings.get("trim_end", 9999))
                speed = float(settings.get("speed", 1.0))
                has_subtitle_text = bool(
                    settings.get("subtitle_text", "").strip()
                    and settings.get("enable_subtitle_text", True)
                )
                segments = _subtitle_svc.transcribe(
                    input_path,
                    trim_start=trim_start,
                    trim_end=trim_end,
                    speed=speed,
                )
                if segments:
                    subs_path = _subtitle_svc.write_ass(
                        segments,
                        has_handle_text=has_subtitle_text,
                    )
            except Exception:
                subs_path = None  # Untertitel-Fehler nicht kritisch

        probe = self._probe(input_path)
        cmd = self._build_command(
            str(input_path), str(output_path), settings, probe,
            subs_path=subs_path,
        )

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await process.communicate()

        if subs_path and os.path.exists(subs_path):
            os.remove(subs_path)

        if process.returncode != 0:
            err = stderr.decode(errors="replace")[-800:]
            raise RuntimeError(f"FFmpeg Fehler:\n{err}")

        return str(output_path)

    # ------------------------------------------------------------------
    # Multi-Clip Processing
    # ------------------------------------------------------------------

    async def _process_multi_clip(
        self,
        input_path: str,
        clips: list[tuple[float, float]],
        settings: dict,
        job_id: str,
    ) -> str:
        """Verarbeitet mehrere Clip-Segmente und konkateniert sie."""
        tmp_clips = []
        concat_list_path = str(self.upload_dir / f"concat_{job_id}.txt")

        try:
            for i, (start, end) in enumerate(clips):
                clip_settings = {**settings, "trim_start": start, "trim_end": end}
                # Subtitel pro Clip (separat)
                subs_path = None
                if settings.get("enable_subtitles", True) and _subtitle_svc.is_available():
                    try:
                        speed = float(settings.get("speed", 1.0))
                        has_sub_text = bool(settings.get("subtitle_text", "").strip())
                        segs = _subtitle_svc.transcribe(
                            input_path,
                            trim_start=start,
                            trim_end=end,
                            speed=speed,
                        )
                        if segs:
                            subs_path = _subtitle_svc.write_ass(segs, has_handle_text=has_sub_text)
                    except Exception:
                        subs_path = None

                tmp_out = str(self.output_dir / f"clip_{job_id}_{i}.mp4")
                probe = self._probe(input_path)
                cmd = self._build_command(
                    input_path, tmp_out, clip_settings, probe, subs_path=subs_path
                )
                proc = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                _, stderr = await proc.communicate()
                if subs_path and os.path.exists(subs_path):
                    os.remove(subs_path)
                if proc.returncode != 0:
                    raise RuntimeError(
                        f"Clip {i} Fehler: {stderr.decode(errors='replace')[-400:]}"
                    )
                tmp_clips.append(tmp_out)

            # Concat-Liste schreiben
            with open(concat_list_path, "w") as f:
                for cp in tmp_clips:
                    f.write(f"file '{cp}'\n")

            # Zusammenfügen
            final_path = str(self.output_dir / f"tiktok_{job_id}.mp4")
            concat_cmd = [
                "ffmpeg", "-y",
                "-f", "concat", "-safe", "0",
                "-i", concat_list_path,
                "-c", "copy",
                final_path,
            ]
            proc = await asyncio.create_subprocess_exec(
                *concat_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            _, stderr = await proc.communicate()
            if proc.returncode != 0:
                raise RuntimeError(
                    f"Concat Fehler: {stderr.decode(errors='replace')[-400:]}"
                )
            return final_path

        finally:
            for cp in tmp_clips:
                if os.path.exists(cp):
                    os.remove(cp)
            if os.path.exists(concat_list_path):
                os.remove(concat_list_path)

    # ------------------------------------------------------------------
    # ffmpeg-Command-Builder
    # ------------------------------------------------------------------

    def _build_command(
        self,
        input_path: str,
        output_path: str,
        settings: dict,
        probe: dict,
        subs_path: Optional[str] = None,
    ) -> list:
        video_stream = next(
            (s for s in probe["streams"] if s["codec_type"] == "video"), None
        )
        has_audio = any(s["codec_type"] == "audio" for s in probe["streams"])
        if not video_stream:
            raise ValueError("Kein Video-Stream gefunden")

        orig_w = int(video_stream["width"])
        orig_h = int(video_stream["height"])
        video_duration = float(probe["format"].get("duration", 0))

        # Feature-Flags
        enable_crop = settings.get("enable_crop", True)
        enable_color = settings.get("enable_color", True)
        enable_speed = settings.get("enable_speed", True)
        enable_title = settings.get("enable_title_text", True)
        enable_sub_text = settings.get("enable_subtitle_text", True)

        trim_start = max(0.0, float(settings.get("trim_start", 0)))
        raw_end = float(settings.get("trim_end", video_duration))
        trim_end = min(raw_end, trim_start + self.MAX_DURATION, video_duration)

        speed = float(settings.get("speed", 1.0)) if enable_speed else 1.0
        speed = max(0.25, min(4.0, speed))

        color_preset = settings.get("color_preset", "original") if enable_color else "original"
        title_text = settings.get("title_text", "").strip() if enable_title else ""
        subtitle_text = settings.get("subtitle_text", "").strip() if enable_sub_text else ""
        music_path = settings.get("music_path", "")
        music_volume = float(settings.get("music_volume", 0.3))
        orig_volume = float(settings.get("original_audio_volume", 1.0))

        has_music = bool(music_path and os.path.exists(music_path))
        font = self._find_font()

        vf = []

        # 1. Crop zu 9:16
        if enable_crop:
            target_ratio = self.TARGET_WIDTH / self.TARGET_HEIGHT
            orig_ratio = orig_w / orig_h
            if orig_ratio > target_ratio:
                crop_h = orig_h
                crop_w = int(orig_h * target_ratio)
                cx = (orig_w - crop_w) // 2
                cy = 0
            else:
                crop_w = orig_w
                crop_h = int(orig_w / target_ratio)
                cx = 0
                cy = (orig_h - crop_h) // 2
            vf.append(f"crop={crop_w}:{crop_h}:{cx}:{cy}")
            vf.append(f"scale={self.TARGET_WIDTH}:{self.TARGET_HEIGHT}")

        # 2. Farbkorrektur
        if enable_color:
            preset_data = self.COLOR_PRESETS.get(color_preset, {})
            eq = self._build_eq_filter(preset_data)
            if eq:
                vf.append(eq)

        # 3. Geschwindigkeit
        if enable_speed and abs(speed - 1.0) > 0.001:
            vf.append(f"setpts={1.0 / speed:.4f}*PTS")

        # 4. Text-Overlays
        font_opt = f"fontfile={font}:" if font else ""
        clip_dur = (trim_end - trim_start) / speed

        if title_text:
            safe = self._escape_drawtext(title_text)
            vf.append(
                f"drawtext={font_opt}text='{safe}':"
                "fontcolor=white:fontsize=68:"
                "borderw=3:bordercolor=black@0.8:"
                f"x=(w-text_w)/2:y=h*0.07:"
                f"enable='between(t,0,{clip_dur:.2f})'"
            )

        if subtitle_text:
            safe = self._escape_drawtext(subtitle_text)
            vf.append(
                f"drawtext={font_opt}text='{safe}':"
                "fontcolor=white:fontsize=46:"
                "borderw=2:bordercolor=black@0.8:"
                f"x=(w-text_w)/2:y=h*0.84:"
                f"enable='between(t,0,{clip_dur:.2f})'"
            )

        # 5. Auto-Untertitel (ASS brennen)
        if subs_path and os.path.exists(subs_path):
            safe_subs = subs_path.replace("\\", "/").replace(":", "\\:")
            vf.append(f"ass={safe_subs}")

        # Befehl zusammenbauen
        cmd = ["ffmpeg", "-y"]
        cmd += ["-ss", f"{trim_start:.3f}", "-to", f"{trim_end:.3f}", "-i", str(input_path)]

        if has_music:
            cmd += ["-stream_loop", "-1", "-i", str(music_path)]

        cmd += ["-vf", ",".join(vf) if vf else "null"]

        # Audio
        atempo = self._build_atempo_chain(speed) if enable_speed else ""

        if has_music and has_audio:
            af_parts = []
            if atempo:
                af_parts.append(f"[0:a]{atempo},volume={orig_volume:.2f}[a0]")
            else:
                af_parts.append(f"[0:a]volume={orig_volume:.2f}[a0]")
            af_parts.append(f"[1:a]volume={music_volume:.2f}[a1]")
            af_parts.append("[a0][a1]amix=inputs=2:duration=first[aout]")
            cmd += ["-filter_complex", ";".join(af_parts), "-map", "0:v", "-map", "[aout]"]
        elif has_music and not has_audio:
            cmd += [
                "-filter_complex", f"[1:a]volume={music_volume:.2f}[aout]",
                "-map", "0:v", "-map", "[aout]",
            ]
        elif has_audio and atempo:
            cmd += ["-af", f"{atempo},volume={orig_volume:.2f}"]
        elif has_audio:
            cmd += ["-af", f"volume={orig_volume:.2f}"]
        else:
            cmd += ["-an"]

        cmd += [
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-profile:v", "high", "-level", "4.0",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
            "-t", f"{clip_dur:.3f}",
            str(output_path),
        ]
        return cmd

    # ------------------------------------------------------------------
    # Hilfsmethoden
    # ------------------------------------------------------------------

    def _parse_clips(
        self, settings: dict, input_path: str
    ) -> list[tuple[float, float]]:
        """Parst Multi-Clip-Segmente oder gibt trim_start/end zurück."""
        raw = settings.get("clips", "")
        if raw:
            try:
                clips = json.loads(raw)
                if isinstance(clips, list) and len(clips) > 0:
                    result = []
                    for c in clips:
                        if isinstance(c, (list, tuple)) and len(c) == 2:
                            result.append((float(c[0]), float(c[1])))
                    if result:
                        return result
            except (json.JSONDecodeError, ValueError):
                pass

        probe = self._probe(input_path)
        duration = float(probe["format"].get("duration", 0))
        start = max(0.0, float(settings.get("trim_start", 0)))
        end = min(float(settings.get("trim_end", duration)), duration)
        return [(start, end)]

    def _probe(self, path: str) -> dict:
        cmd = [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_streams", "-show_format", str(path),
        ]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if r.returncode != 0:
            raise RuntimeError(f"ffprobe Fehler: {r.stderr}")
        return json.loads(r.stdout)

    def _escape_drawtext(self, text: str) -> str:
        return (
            text
            .replace("\\", "\\\\")
            .replace("'", "\u2019")
            .replace(":", "\\:")
            .replace("%", "\\%")
        )

    def _build_atempo_chain(self, speed: float) -> str:
        if abs(speed - 1.0) < 0.001:
            return ""
        filters = []
        s = speed
        while s > 2.0:
            filters.append("atempo=2.0")
            s /= 2.0
        while s < 0.5:
            filters.append("atempo=0.5")
            s /= 0.5
        if abs(s - 1.0) > 0.001:
            filters.append(f"atempo={s:.4f}")
        return ",".join(filters)

    def _build_eq_filter(self, preset: dict) -> Optional[str]:
        if not preset:
            return None
        parts = []
        for key in ("brightness", "contrast", "saturation", "gamma",
                    "gamma_r", "gamma_g", "gamma_b"):
            if key in preset:
                parts.append(f"{key}={preset[key]}")
        return f"eq={':'.join(parts)}" if parts else None

    def _find_font(self) -> str:
        for c in [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
        ]:
            if os.path.exists(c):
                return c
        return ""
