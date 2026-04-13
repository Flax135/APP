"""
Thumbnail Service — generiert hochwertige Thumbnails aus Videos.
Nutzt ffmpegs eingebauten Thumbnail-Filter für den besten Frame.
"""
import json
import os
import subprocess
import uuid
from pathlib import Path
from typing import Optional

from PIL import Image, ImageEnhance, ImageFilter

OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

# Gleiche Farbeinstellungen wie VideoService
COLOR_ADJUSTMENTS = {
    "original": {},
    "vivid":     {"brightness": 1.1,  "contrast": 1.25, "saturation": 1.4},
    "cinematic": {"brightness": 0.92, "contrast": 1.2,  "saturation": 0.75},
    "warm":      {"brightness": 1.05, "contrast": 1.1,  "saturation": 1.1},
    "cold":      {"brightness": 1.02, "contrast": 1.1,  "saturation": 1.0},
    "vsco":      {"brightness": 1.08, "contrast": 1.05, "saturation": 0.85},
    "dark":      {"brightness": 0.88, "contrast": 1.3,  "saturation": 1.1},
}


class ThumbnailService:
    TARGET_W = 1080
    TARGET_H = 1920

    def generate(
        self,
        video_path: str,
        color_preset: str = "original",
        title_text: str = "",
        timestamp: Optional[float] = None,
        job_id: str = "",
    ) -> str:
        """
        Generiert ein Thumbnail aus dem Video.
        Gibt den Pfad zur PNG-Datei zurück.
        """
        uid = job_id or uuid.uuid4().hex[:8]
        raw_frame = str(OUTPUT_DIR / f"thumb_raw_{uid}.jpg")
        final_thumb = str(OUTPUT_DIR / f"thumb_{uid}.jpg")

        # 1. Besten Frame extrahieren
        if timestamp is not None:
            self._extract_at(video_path, timestamp, raw_frame)
        else:
            self._extract_best(video_path, raw_frame)

        if not os.path.exists(raw_frame):
            raise RuntimeError("Thumbnail-Frame konnte nicht extrahiert werden")

        # 2. Crop + Scale auf 9:16
        cropped = self._crop_to_916(raw_frame, uid)

        # 3. Farbkorrektur anwenden
        graded = self._apply_color(cropped, color_preset, uid)

        # 4. Text overlay (optional)
        if title_text:
            self._add_text(graded, title_text, final_thumb)
        else:
            import shutil
            shutil.copy(graded, final_thumb)

        # Temp-Dateien aufräumen
        for p in [raw_frame, cropped, graded]:
            if p != final_thumb and os.path.exists(p):
                os.remove(p)

        return final_thumb

    def _extract_best(self, video_path: str, out_path: str):
        """Nutzt ffmpegs thumbnail-Filter für den visuell besten Frame."""
        cmd = [
            "ffmpeg", "-y", "-i", str(video_path),
            "-vf", "thumbnail=300",
            "-frames:v", "1",
            "-q:v", "2",
            out_path,
        ]
        subprocess.run(cmd, capture_output=True, timeout=60)

    def _extract_at(self, video_path: str, ts: float, out_path: str):
        """Extrahiert Frame an einem spezifischen Zeitstempel."""
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(ts),
            "-i", str(video_path),
            "-frames:v", "1",
            "-q:v", "2",
            out_path,
        ]
        subprocess.run(cmd, capture_output=True, timeout=30)

    def _crop_to_916(self, frame_path: str, uid: str) -> str:
        """Croppt und skaliert auf 1080×1920."""
        out = str(OUTPUT_DIR / f"thumb_crop_{uid}.jpg")
        cmd = [
            "ffmpeg", "-y", "-i", frame_path,
            "-vf", (
                f"scale={self.TARGET_W*2}:{self.TARGET_H*2}:force_original_aspect_ratio=increase,"
                f"crop={self.TARGET_W}:{self.TARGET_H}"
            ),
            "-q:v", "2",
            out,
        ]
        r = subprocess.run(cmd, capture_output=True, timeout=30)
        return out if os.path.exists(out) else frame_path

    def _apply_color(self, frame_path: str, preset: str, uid: str) -> str:
        """Wendet Farbkorrektur via Pillow an."""
        adj = COLOR_ADJUSTMENTS.get(preset, {})
        if not adj:
            return frame_path

        out = str(OUTPUT_DIR / f"thumb_graded_{uid}.jpg")
        try:
            img = Image.open(frame_path).convert("RGB")

            if "brightness" in adj:
                img = ImageEnhance.Brightness(img).enhance(adj["brightness"])
            if "contrast" in adj:
                img = ImageEnhance.Contrast(img).enhance(adj["contrast"])
            if "saturation" in adj:
                img = ImageEnhance.Color(img).enhance(adj["saturation"])

            # Warm-Effekt: roten Kanal leicht boosten, blauen reduzieren
            if preset == "warm":
                r, g, b = img.split()
                r = r.point(lambda x: min(255, int(x * 1.08)))
                b = b.point(lambda x: int(x * 0.92))
                img = Image.merge("RGB", (r, g, b))
            elif preset == "cold":
                r, g, b = img.split()
                r = r.point(lambda x: int(x * 0.92))
                b = b.point(lambda x: min(255, int(x * 1.08)))
                img = Image.merge("RGB", (r, g, b))

            img.save(out, "JPEG", quality=92)
            return out
        except Exception:
            return frame_path

    def _add_text(self, frame_path: str, text: str, out_path: str):
        """Fügt Titeltext mit ffmpeg drawtext hinzu."""
        safe = text.replace("'", "\u2019").replace(":", "\\:").replace("%", "\\%")
        font = self._find_font()
        font_opt = f"fontfile={font}:" if font else ""

        cmd = [
            "ffmpeg", "-y", "-i", frame_path,
            "-vf", (
                f"drawtext={font_opt}"
                f"text='{safe}':"
                "fontcolor=white:fontsize=72:"
                "borderw=3:bordercolor=black@0.85:"
                "x=(w-text_w)/2:y=h*0.07"
            ),
            "-q:v", "2",
            out_path,
        ]
        r = subprocess.run(cmd, capture_output=True, timeout=30)
        if r.returncode != 0 or not os.path.exists(out_path):
            import shutil
            shutil.copy(frame_path, out_path)

    @staticmethod
    def _find_font() -> str:
        for p in [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
        ]:
            if os.path.exists(p):
                return p
        return ""

    @staticmethod
    def _get_duration(video_path: str) -> float:
        cmd = [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_format", str(video_path),
        ]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        return float(json.loads(r.stdout)["format"].get("duration", 0))
