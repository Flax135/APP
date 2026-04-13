import os
import shutil
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from backend.app.services.video_service import VideoService

router = APIRouter(prefix="/api/video", tags=["video"])
video_service = VideoService()

ALLOWED_VIDEO_TYPES = {
    "video/mp4", "video/quicktime", "video/x-msvideo",
    "video/webm", "video/mpeg", "video/3gpp",
}
ALLOWED_AUDIO_TYPES = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
    "audio/aac", "audio/ogg", "audio/flac",
}


@router.post("/info")
async def get_video_info(file: UploadFile = File(...)):
    """Gibt Metadaten des Videos zurück (Dauer, Auflösung, etc.)."""
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(400, "Nur Videodateien erlaubt (mp4, mov, avi, webm)")

    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    tmp_path = upload_dir / f"probe_{uuid.uuid4().hex[:8]}{Path(file.filename or 'video.mp4').suffix}"

    try:
        with open(tmp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        info = video_service.get_video_info(str(tmp_path))
        return info
    finally:
        if tmp_path.exists():
            os.remove(tmp_path)


@router.post("/process")
async def process_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    music: Optional[UploadFile] = File(None),
    trim_start: float = Form(0.0),
    trim_end: float = Form(60.0),
    speed: float = Form(1.0),
    color_preset: str = Form("original"),
    title_text: str = Form(""),
    subtitle_text: str = Form(""),
    music_volume: float = Form(0.3),
    original_audio_volume: float = Form(1.0),
):
    """Video bearbeiten und für TikTok/Reels optimieren."""
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(400, "Nur Videodateien erlaubt (mp4, mov, avi, webm)")

    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)

    vid_id = uuid.uuid4().hex[:8]
    suffix = Path(file.filename or "video.mp4").suffix or ".mp4"
    input_path = upload_dir / f"input_{vid_id}{suffix}"

    with open(input_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    music_path = ""
    if music and music.content_type in ALLOWED_AUDIO_TYPES:
        msuffix = Path(music.filename or "music.mp3").suffix or ".mp3"
        music_path = str(upload_dir / f"music_{vid_id}{msuffix}")
        with open(music_path, "wb") as f:
            shutil.copyfileobj(music.file, f)

    settings = {
        "trim_start": trim_start,
        "trim_end": trim_end,
        "speed": speed,
        "color_preset": color_preset,
        "title_text": title_text,
        "subtitle_text": subtitle_text,
        "music_path": music_path,
        "music_volume": music_volume,
        "original_audio_volume": original_audio_volume,
    }

    try:
        job_id = await video_service.process_video(str(input_path), settings)
    except RuntimeError as exc:
        raise HTTPException(500, str(exc)) from exc
    finally:
        background_tasks.add_task(_cleanup, str(input_path), music_path)

    job = video_service.get_job(job_id)
    if job["status"] == "error":
        raise HTTPException(500, f"Verarbeitung fehlgeschlagen: {job.get('error', '')}")

    return {
        "job_id": job_id,
        "status": job["status"],
        "filename": job.get("filename"),
    }


@router.get("/download/{job_id}")
async def download_video(job_id: str, background_tasks: BackgroundTasks):
    """Fertig bearbeitetes Video herunterladen."""
    job = video_service.get_job(job_id)

    if job["status"] == "not_found":
        raise HTTPException(404, "Job nicht gefunden")
    if job["status"] == "error":
        raise HTTPException(500, f"Verarbeitung fehlgeschlagen: {job.get('error')}")
    if job["status"] != "done":
        raise HTTPException(400, f"Video noch nicht fertig (Status: {job['status']})")

    output_path = job["output_path"]
    if not os.path.exists(output_path):
        raise HTTPException(404, "Ausgabedatei nicht mehr vorhanden")

    background_tasks.add_task(_cleanup, output_path)
    return FileResponse(
        output_path,
        media_type="video/mp4",
        filename=job["filename"],
        headers={"Content-Disposition": f'attachment; filename="{job["filename"]}"'},
    )


@router.get("/presets")
async def get_presets():
    """Verfügbare Farbpresets und Einstellungen."""
    return {
        "color_presets": list(video_service.COLOR_PRESETS.keys()),
        "max_duration": video_service.MAX_DURATION,
        "target_resolution": f"{video_service.TARGET_WIDTH}x{video_service.TARGET_HEIGHT}",
        "target_format": "9:16 (TikTok / Reels)",
    }


def _cleanup(*paths: str):
    for p in paths:
        if p and os.path.exists(p):
            try:
                os.remove(p)
            except OSError:
                pass
