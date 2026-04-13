import asyncio
import json
import os
import subprocess
import uuid
from pathlib import Path
from typing import Optional


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

    def _probe(self, path: str) -> dict:
        cmd = [
            "ffprobe", "-v", "quiet",
            "-print_format", "json",
            "-show_streams", "-show_format",
            str(path),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            raise RuntimeError(f"ffprobe Fehler: {result.stderr}")
        return json.loads(result.stdout)

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
        for key in ("brightness", "contrast", "saturation", "gamma", "gamma_r", "gamma_g", "gamma_b"):
            if key in preset:
                parts.append(f"{key}={preset[key]}")
        return f"eq={':'.join(parts)}" if parts else None

    def _find_font(self) -> str:
        candidates = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
        ]
        for c in candidates:
            if os.path.exists(c):
                return c
        return ""

    def _build_command(
        self,
        input_path: str,
        output_path: str,
        settings: dict,
        probe: dict,
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

        trim_start = max(0.0, float(settings.get("trim_start", 0)))
        raw_end = float(settings.get("trim_end", video_duration))
        trim_end = min(raw_end, trim_start + self.MAX_DURATION, video_duration)

        speed = float(settings.get("speed", 1.0))
        speed = max(0.25, min(4.0, speed))

        color_preset = settings.get("color_preset", "original")
        title_text = settings.get("title_text", "").strip()
        subtitle_text = settings.get("subtitle_text", "").strip()
        music_path = settings.get("music_path", "")
        music_volume = float(settings.get("music_volume", 0.3))
        orig_volume = float(settings.get("original_audio_volume", 1.0))

        has_music = bool(music_path and os.path.exists(music_path))
        font = self._find_font()

        # --- Video filter chain ---
        vf = []

        # 1. Crop to 9:16
        target_ratio = self.TARGET_WIDTH / self.TARGET_HEIGHT  # 0.5625
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

        # 2. Color grading
        preset_data = self.COLOR_PRESETS.get(color_preset, {})
        eq = self._build_eq_filter(preset_data)
        if eq:
            vf.append(eq)

        # 3. Speed (video pts)
        if abs(speed - 1.0) > 0.001:
            vf.append(f"setpts={1.0 / speed:.4f}*PTS")

        # 4. Text overlays
        font_opt = f"fontfile={font}:" if font else ""
        clip_dur = (trim_end - trim_start) / speed

        if title_text:
            safe = self._escape_drawtext(title_text)
            vf.append(
                f"drawtext={font_opt}"
                f"text='{safe}':"
                f"fontcolor=white:fontsize=68:"
                f"borderw=3:bordercolor=black@0.8:"
                f"x=(w-text_w)/2:y=h*0.07:"
                f"enable='between(t,0,{clip_dur:.2f})'"
            )

        if subtitle_text:
            safe = self._escape_drawtext(subtitle_text)
            vf.append(
                f"drawtext={font_opt}"
                f"text='{safe}':"
                f"fontcolor=white:fontsize=46:"
                f"borderw=2:bordercolor=black@0.8:"
                f"x=(w-text_w)/2:y=h*0.84:"
                f"enable='between(t,0,{clip_dur:.2f})'"
            )

        # --- Build command ---
        cmd = ["ffmpeg", "-y"]

        # Trim input
        cmd += ["-ss", f"{trim_start:.3f}", "-to", f"{trim_end:.3f}", "-i", str(input_path)]

        # Music input (looped)
        if has_music:
            cmd += ["-stream_loop", "-1", "-i", str(music_path)]

        # Video filter
        cmd += ["-vf", ",".join(vf)]

        # Audio
        atempo = self._build_atempo_chain(speed)

        if has_music and has_audio:
            af_parts = []
            if atempo:
                af_parts.append(f"[0:a]{atempo},volume={orig_volume:.2f}[a0]")
            else:
                af_parts.append(f"[0:a]volume={orig_volume:.2f}[a0]")
            af_parts.append(f"[1:a]volume={music_volume:.2f}[a1]")
            af_parts.append("[a0][a1]amix=inputs=2:duration=first[aout]")
            cmd += [
                "-filter_complex", ";".join(af_parts),
                "-map", "0:v",
                "-map", "[aout]",
            ]
        elif has_music and not has_audio:
            cmd += [
                "-filter_complex",
                f"[1:a]volume={music_volume:.2f}[aout]",
                "-map", "0:v",
                "-map", "[aout]",
            ]
        elif has_audio and atempo:
            cmd += ["-af", f"{atempo},volume={orig_volume:.2f}"]
        elif has_audio:
            cmd += ["-af", f"volume={orig_volume:.2f}"]
        else:
            cmd += ["-an"]

        # Output: TikTok/Reels optimized
        cmd += [
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-profile:v", "high",
            "-level", "4.0",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            "-c:a", "aac",
            "-b:a", "128k",
            "-ar", "44100",
            "-t", f"{clip_dur:.3f}",
            str(output_path),
        ]
        return cmd

    async def process_video(self, input_path: str, settings: dict) -> str:
        job_id = str(uuid.uuid4())[:8]
        output_path = self.output_dir / f"tiktok_{job_id}.mp4"
        self.jobs[job_id] = {"status": "processing"}

        try:
            probe = self._probe(input_path)
            cmd = self._build_command(str(input_path), str(output_path), settings, probe)

            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            _, stderr = await process.communicate()

            if process.returncode != 0:
                err = stderr.decode(errors="replace")[-800:]
                self.jobs[job_id] = {"status": "error", "error": err}
                raise RuntimeError(f"FFmpeg Fehler:\n{err}")

            self.jobs[job_id] = {
                "status": "done",
                "output_path": str(output_path),
                "filename": output_path.name,
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
