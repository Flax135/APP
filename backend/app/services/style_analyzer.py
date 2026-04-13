"""
Style Analyzer — extrahiert den Editing-Stil aus Referenz-Videos.
Unterstützt lokale Dateien und URLs (YouTube, TikTok, Instagram, etc.)
"""
import asyncio
import base64
import json
import os
import re
import shutil
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import Optional

import anthropic
from PIL import Image

from backend.app.config import settings


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


class StyleProfile:
    """Ergebnis einer Stil-Analyse."""

    def __init__(self, data: dict):
        self.source_title: str = data.get("source_title", "Unbekannt")
        self.duration: float = data.get("duration", 0)
        self.cut_count: int = data.get("cut_count", 0)
        self.avg_shot_duration: float = data.get("avg_shot_duration", 0)
        self.pacing: str = data.get("pacing", "medium")   # slow / medium / fast
        self.energy_level: int = data.get("energy_level", 5)  # 1–10
        self.color_palette: list = data.get("color_palette", [])
        self.color_mood: str = data.get("color_mood", "neutral")
        self.recommended_preset: str = data.get("recommended_preset", "original")
        self.recommended_speed: float = data.get("recommended_speed", 1.0)
        self.recommended_music_energy: str = data.get("recommended_music_energy", "medium")
        self.text_style: str = data.get("text_style", "")
        self.hook_type: str = data.get("hook_type", "")
        self.style_description: str = data.get("style_description", "")
        self.vision_notes: str = data.get("vision_notes", "")
        self.suggested_title_text: str = data.get("suggested_title_text", "")
        self.suggested_subtitle_text: str = data.get("suggested_subtitle_text", "")

    def to_dict(self) -> dict:
        return self.__dict__


class StyleAnalyzer:

    # Schnitt-Schwellenwert für ffmpeg scene detection
    SCENE_THRESHOLD = 0.25
    # Sekunden zwischen extrahierten Frames für die Vision-Analyse
    FRAME_INTERVAL = 3
    # Max Frames zur Vision-Analyse (Kosten-Kontrolle)
    MAX_VISION_FRAMES = 5

    def __init__(self):
        self._client: Optional[anthropic.Anthropic] = None

    @property
    def client(self) -> anthropic.Anthropic:
        if self._client is None:
            self._client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        return self._client

    # ------------------------------------------------------------------
    # Öffentliche API
    # ------------------------------------------------------------------

    async def analyze_from_file(self, video_path: str) -> StyleProfile:
        """Analysiere eine lokale Videodatei."""
        return await self._analyze(video_path, source_title=Path(video_path).name)

    async def analyze_from_url(self, url: str) -> tuple[StyleProfile, str]:
        """
        Lade Video von URL herunter (yt-dlp) und analysiere den Stil.
        Gibt (StyleProfile, tmp_path) zurück — Aufrufer ist für Cleanup verantwortlich.
        """
        tmp_path = await self._download_url(url)
        title = await self._get_url_title(url)
        profile = await self._analyze(tmp_path, source_title=title)
        return profile, tmp_path

    # ------------------------------------------------------------------
    # Download (yt-dlp)
    # ------------------------------------------------------------------

    async def _get_url_title(self, url: str) -> str:
        try:
            result = await asyncio.create_subprocess_exec(
                "yt-dlp", "--get-title", "--no-playlist", url,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,
            )
            stdout, _ = await asyncio.wait_for(result.communicate(), timeout=15)
            return stdout.decode().strip()[:80] or url
        except Exception:
            return url

    async def _download_url(self, url: str) -> str:
        """Lade Video mit yt-dlp herunter. Gibt lokalen Pfad zurück."""
        uid = uuid.uuid4().hex[:8]
        out_template = str(UPLOAD_DIR / f"ref_{uid}.%(ext)s")

        cmd = [
            "yt-dlp",
            "--no-playlist",
            "-f", "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]/best",
            "--merge-output-format", "mp4",
            "--max-filesize", "150m",
            "-o", out_template,
            "--quiet",
            url,
        ]

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await asyncio.wait_for(process.communicate(), timeout=120)

        if process.returncode != 0:
            err = stderr.decode(errors="replace")[-400:]
            raise RuntimeError(f"yt-dlp Fehler: {err}")

        # Finde die heruntergeladene Datei
        matches = list(UPLOAD_DIR.glob(f"ref_{uid}.*"))
        if not matches:
            raise RuntimeError("yt-dlp hat keine Datei erzeugt")
        return str(matches[0])

    # ------------------------------------------------------------------
    # Haupt-Analyse-Pipeline
    # ------------------------------------------------------------------

    async def _analyze(self, video_path: str, source_title: str) -> StyleProfile:
        # 1. Basis-Metadaten
        probe = self._probe(video_path)
        duration = float(probe["format"].get("duration", 0))

        # 2. Schnitt-Erkennung (sync, schnell)
        cut_count = self._detect_cuts(video_path)

        # 3. Frames extrahieren
        frames = self._extract_frames(video_path, duration)

        # 4. Farbpalette
        palette, color_mood = self._analyze_colors(frames)

        # 5. Claude Vision Analyse (async)
        vision_data = await self._vision_analysis(frames, duration, cut_count)

        # 6. StyleProfile zusammenbauen
        avg_shot = round(duration / max(cut_count, 1), 2)
        pacing = self._classify_pacing(avg_shot)
        preset = self._map_mood_to_preset(color_mood, vision_data.get("color_grade", ""))
        speed = self._suggest_speed(pacing, vision_data.get("energy_level", 5))

        data = {
            "source_title": source_title,
            "duration": round(duration, 1),
            "cut_count": cut_count,
            "avg_shot_duration": avg_shot,
            "pacing": pacing,
            "energy_level": vision_data.get("energy_level", 5),
            "color_palette": palette,
            "color_mood": color_mood,
            "recommended_preset": preset,
            "recommended_speed": speed,
            "recommended_music_energy": vision_data.get("music_energy", "medium"),
            "text_style": vision_data.get("text_style", ""),
            "hook_type": vision_data.get("hook_type", ""),
            "style_description": vision_data.get("style_description", ""),
            "vision_notes": vision_data.get("vision_notes", ""),
            "suggested_title_text": vision_data.get("suggested_title_text", ""),
            "suggested_subtitle_text": vision_data.get("suggested_subtitle_text", ""),
        }

        # Cleanup frames
        for f in frames:
            try:
                os.remove(f)
            except OSError:
                pass

        return StyleProfile(data)

    # ------------------------------------------------------------------
    # ffprobe
    # ------------------------------------------------------------------

    def _probe(self, path: str) -> dict:
        cmd = [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_streams", "-show_format", str(path),
        ]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return json.loads(r.stdout)

    # ------------------------------------------------------------------
    # Schnitt-Erkennung
    # ------------------------------------------------------------------

    def _detect_cuts(self, video_path: str) -> int:
        """Zählt Szenenwechsel mit ffmpeg scene detection."""
        cmd = [
            "ffmpeg", "-i", str(video_path),
            "-vf", f"select='gt(scene,{self.SCENE_THRESHOLD})',metadata=print:file=-",
            "-an", "-f", "null", "-",
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        # Jede Zeile mit "pts_time" ist ein erkannter Schnitt
        cuts = len(re.findall(r"pts_time", result.stdout + result.stderr))
        return max(cuts, 1)

    # ------------------------------------------------------------------
    # Frame-Extraktion
    # ------------------------------------------------------------------

    def _extract_frames(self, video_path: str, duration: float) -> list[str]:
        """Extrahiert gleichmäßig verteilte Frames als JPEG."""
        frame_dir = UPLOAD_DIR / f"frames_{uuid.uuid4().hex[:6]}"
        frame_dir.mkdir(exist_ok=True)

        interval = max(self.FRAME_INTERVAL, duration / self.MAX_VISION_FRAMES)

        cmd = [
            "ffmpeg", "-i", str(video_path),
            "-vf", f"fps=1/{interval:.2f},scale=640:-2",
            "-q:v", "3",
            "-frames:v", str(self.MAX_VISION_FRAMES),
            str(frame_dir / "frame_%04d.jpg"),
        ]
        subprocess.run(cmd, capture_output=True, timeout=60)

        frames = sorted(frame_dir.glob("frame_*.jpg"))
        return [str(f) for f in frames]

    # ------------------------------------------------------------------
    # Farb-Analyse
    # ------------------------------------------------------------------

    def _analyze_colors(self, frames: list[str]) -> tuple[list[str], str]:
        """Extrahiert dominante Farben und bestimmt die Farbstimmung."""
        if not frames:
            return [], "neutral"

        all_pixels: list[tuple[int, int, int]] = []
        for frame_path in frames[:4]:
            try:
                img = Image.open(frame_path).convert("RGB")
                img = img.resize((80, 80))
                # Quantize → dominante Farben
                quantized = img.quantize(colors=8, method=Image.Quantize.FASTOCTREE)
                palette_img = quantized.convert("RGB")
                pixels = list(palette_img.getdata())
                all_pixels.extend(pixels[::10])
            except Exception:
                continue

        if not all_pixels:
            return [], "neutral"

        # Durchschnittliche RGB-Werte der dominanten Cluster
        r_avg = sum(p[0] for p in all_pixels) / len(all_pixels)
        g_avg = sum(p[1] for p in all_pixels) / len(all_pixels)
        b_avg = sum(p[2] for p in all_pixels) / len(all_pixels)
        brightness = (r_avg + g_avg + b_avg) / 3

        # Top-5 dominante Farben als HEX
        color_counts: dict[str, int] = {}
        for r, g, b in all_pixels:
            # Quantize auf 6-bit für Gruppenbildung
            rq, gq, bq = (r >> 2) << 2, (g >> 2) << 2, (b >> 2) << 2
            key = f"#{rq:02x}{gq:02x}{bq:02x}"
            color_counts[key] = color_counts.get(key, 0) + 1
        palette = [c for c, _ in sorted(color_counts.items(), key=lambda x: -x[1])[:6]]

        # Farbstimmung bestimmen
        warm_score = (r_avg - b_avg) / 255
        saturation = max(r_avg, g_avg, b_avg) - min(r_avg, g_avg, b_avg)

        if brightness < 60:
            mood = "dark"
        elif warm_score > 0.12:
            mood = "warm"
        elif warm_score < -0.12:
            mood = "cold"
        elif saturation < 40:
            mood = "vsco"
        elif saturation > 100:
            mood = "vivid"
        else:
            mood = "cinematic"

        return palette, mood

    def _map_mood_to_preset(self, color_mood: str, vision_grade: str) -> str:
        preset_map = {
            "dark": "dark",
            "warm": "warm",
            "cold": "cold",
            "vsco": "vsco",
            "vivid": "vivid",
            "cinematic": "cinematic",
            "neutral": "original",
        }
        return preset_map.get(color_mood, "original")

    # ------------------------------------------------------------------
    # Pacing & Speed-Empfehlung
    # ------------------------------------------------------------------

    def _classify_pacing(self, avg_shot: float) -> str:
        if avg_shot < 2.0:
            return "fast"
        if avg_shot < 4.5:
            return "medium"
        return "slow"

    def _suggest_speed(self, pacing: str, energy: int) -> float:
        if pacing == "slow" and energy >= 7:
            return 1.2
        if pacing == "slow" and energy >= 5:
            return 1.1
        return 1.0

    # ------------------------------------------------------------------
    # Claude Vision Analyse
    # ------------------------------------------------------------------

    async def _vision_analysis(
        self, frames: list[str], duration: float, cut_count: int
    ) -> dict:
        if not frames or not settings.ANTHROPIC_API_KEY:
            return {}

        # Bis zu MAX_VISION_FRAMES Frames als base64 einbetten
        image_blocks = []
        for fp in frames[: self.MAX_VISION_FRAMES]:
            try:
                with open(fp, "rb") as f:
                    data = base64.standard_b64encode(f.read()).decode()
                image_blocks.append({
                    "type": "image",
                    "source": {"type": "base64", "media_type": "image/jpeg", "data": data},
                })
            except Exception:
                continue

        if not image_blocks:
            return {}

        prompt = f"""Du analysierst {len(image_blocks)} gleichmäßig verteilte Frames aus einem Video
(Gesamtlänge: {duration:.0f}s, erkannte Schnitte: {cut_count}).

Analysiere den Editing-Stil dieses Videos und antworte NUR mit einem JSON-Objekt:

{{
  "style_description": "1-2 Sätze: Was ist der visuelle Stil / die Ästhetik?",
  "color_grade": "original|vivid|cinematic|warm|cold|vsco|dark",
  "energy_level": <1-10>,
  "music_energy": "calm|medium|energetic",
  "text_style": "Wie sind Texte/Untertitel gestaltet? (Farbe, Größe, Position, Stil). Leer wenn kein Text.",
  "hook_type": "result|question|controversy|visual|empathy|unknown",
  "vision_notes": "2-3 präzise Editing-Beobachtungen (Übergänge, Zooms, Effekte, etc.)",
  "suggested_title_text": "Passender kurzer Titeltext (max. 6 Wörter) im Stil des Videos",
  "suggested_subtitle_text": "Passender Untertiteltext oder Handle-Platzhalter"
}}

Antworte ausschließlich mit dem JSON, ohne Markdown-Backticks."""

        content = image_blocks + [{"type": "text", "text": prompt}]

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.messages.create(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=600,
                    messages=[{"role": "user", "content": content}],
                ),
            )
            raw = response.content[0].text.strip()
            # JSON aus der Antwort extrahieren
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                return json.loads(match.group())
        except Exception as exc:
            return {"vision_notes": f"Vision-Analyse Fehler: {exc}"}

        return {}
