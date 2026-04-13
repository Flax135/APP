"""
Subtitle Service — automatische Untertitel via faster-whisper.
Generiert ASS-Dateien im TikTok/Reels-Stil und brennt sie in Videos ein.
"""
import asyncio
import os
import subprocess
import uuid
from pathlib import Path
from typing import Optional

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def _format_ass_time(seconds: float) -> str:
    """Konvertiert Sekunden → ASS-Zeitformat h:mm:ss.cs"""
    cs = int((seconds % 1) * 100)
    s = int(seconds) % 60
    m = int(seconds) // 60 % 60
    h = int(seconds) // 3600
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def _format_srt_time(seconds: float) -> str:
    """Konvertiert Sekunden → SRT-Zeitformat hh:mm:ss,ms"""
    ms = int((seconds % 1) * 1000)
    s = int(seconds) % 60
    m = int(seconds) // 60 % 60
    h = int(seconds) // 3600
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


class SubtitleService:
    # Standard TikTok/Reels Stil
    ASS_STYLE = (
        "FontName=Arial,Fontsize=68,PrimaryColour=&H00FFFFFF,"
        "OutlineColour=&H00000000,BackColour=&H00000000,"
        "Bold=1,BorderStyle=1,Outline=3,Shadow=0,"
        "Alignment=2,MarginL=40,MarginR=40,MarginV=120"
    )

    def __init__(self, model_size: str = "base"):
        self.model_size = model_size
        self._model = None

    def _load_model(self):
        """Lazy-load faster-whisper Modell."""
        if self._model is not None:
            return self._model
        try:
            from faster_whisper import WhisperModel
            self._model = WhisperModel(
                self.model_size,
                device="cpu",
                compute_type="int8",
            )
            return self._model
        except ImportError as exc:
            raise RuntimeError(
                "faster-whisper nicht installiert. "
                "Bitte: pip install faster-whisper"
            ) from exc

    def _extract_audio(self, video_path: str, start: float, end: float) -> str:
        """Extrahiert Audio-Segment für Whisper-Transkription."""
        out = str(UPLOAD_DIR / f"audio_{uuid.uuid4().hex[:8]}.wav")
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start), "-to", str(end),
            "-i", str(video_path),
            "-vn", "-ac", "1", "-ar", "16000",
            "-c:a", "pcm_s16le",
            out,
        ]
        r = subprocess.run(cmd, capture_output=True, timeout=120)
        if r.returncode != 0:
            raise RuntimeError(f"Audio-Extraktion fehlgeschlagen: {r.stderr.decode()[-300:]}")
        return out

    def transcribe(
        self,
        video_path: str,
        trim_start: float = 0.0,
        trim_end: Optional[float] = None,
        speed: float = 1.0,
        language: Optional[str] = None,
    ) -> list[dict]:
        """
        Transkribiert Audio aus dem Video-Segment.
        Gibt Liste von {start, end, text} zurück — bereits für Trim & Speed angepasst.
        """
        model = self._load_model()
        probe_dur = self._get_duration(video_path)
        end = min(trim_end if trim_end is not None else probe_dur, probe_dur)

        audio_path = self._extract_audio(video_path, trim_start, end)
        try:
            kwargs = {"beam_size": 5, "vad_filter": True}
            if language:
                kwargs["language"] = language

            segments_iter, _ = model.transcribe(audio_path, **kwargs)
            segments = []
            for seg in segments_iter:
                # Zeitstempel anpassen: Trim-Offset entfernen, Speed-Faktor anwenden
                adj_start = seg.start / speed
                adj_end = seg.end / speed
                clip_dur = (end - trim_start) / speed
                if adj_start >= clip_dur:
                    break
                segments.append({
                    "start": round(adj_start, 3),
                    "end": round(min(adj_end, clip_dur), 3),
                    "text": seg.text.strip(),
                })
            return segments
        finally:
            if os.path.exists(audio_path):
                os.remove(audio_path)

    def to_ass(self, segments: list[dict], margin_v: int = 120) -> str:
        """Generiert ASS-Datei im TikTok/Reels-Stil."""
        style = (
            "FontName=Arial,Fontsize=68,PrimaryColour=&H00FFFFFF,"
            "OutlineColour=&H00000000,BackColour=&H00000000,"
            f"Bold=1,BorderStyle=1,Outline=3,Shadow=0,"
            f"Alignment=2,MarginL=40,MarginR=40,MarginV={margin_v}"
        )

        header = (
            "[Script Info]\n"
            "ScriptType: v4.00+\n"
            "PlayResX: 1080\n"
            "PlayResY: 1920\n"
            "ScaledBorderAndShadow: yes\n\n"
            "[V4+ Styles]\n"
            "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, "
            "OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, "
            "ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
            "Alignment, MarginL, MarginR, MarginV, Encoding\n"
            "Style: Default,Arial,68,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,"
            f"1,0,0,0,100,100,0,0,1,3,0,2,40,40,{margin_v},1\n\n"
            "[Events]\n"
            "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
        )

        lines = [header]
        for seg in segments:
            if not seg["text"]:
                continue
            t_start = _format_ass_time(seg["start"])
            t_end = _format_ass_time(seg["end"])
            # Zeilenumbruch bei >6 Wörtern
            text = self._wrap_text(seg["text"], max_words=6)
            lines.append(f"Dialogue: 0,{t_start},{t_end},Default,,0,0,0,,{text}\n")

        return "".join(lines)

    def to_srt(self, segments: list[dict]) -> str:
        """Generiert SRT als Fallback."""
        lines = []
        for i, seg in enumerate(segments, 1):
            lines.append(str(i))
            lines.append(f"{_format_srt_time(seg['start'])} --> {_format_srt_time(seg['end'])}")
            lines.append(seg["text"])
            lines.append("")
        return "\n".join(lines)

    def write_ass(
        self, segments: list[dict], has_handle_text: bool = False
    ) -> str:
        """
        Schreibt ASS-Datei und gibt Pfad zurück.
        Wenn has_handle_text=True, wird MarginV erhöht um Überlappung zu vermeiden.
        """
        margin_v = 200 if has_handle_text else 120
        content = self.to_ass(segments, margin_v=margin_v)
        path = str(UPLOAD_DIR / f"subs_{uuid.uuid4().hex[:8]}.ass")
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return path

    @staticmethod
    def _wrap_text(text: str, max_words: int = 6) -> str:
        """Bricht langen Text in max. zwei Zeilen auf."""
        words = text.split()
        if len(words) <= max_words:
            return text
        mid = len(words) // 2
        return " ".join(words[:mid]) + r"\N" + " ".join(words[mid:])

    @staticmethod
    def _get_duration(video_path: str) -> float:
        import json
        cmd = [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_format", str(video_path),
        ]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        data = json.loads(r.stdout)
        return float(data["format"].get("duration", 0))

    def is_available(self) -> bool:
        """Prüft ob faster-whisper installiert ist."""
        try:
            import faster_whisper  # noqa: F401
            return True
        except ImportError:
            return False
