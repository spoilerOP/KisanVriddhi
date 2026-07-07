"""
TTS Router — Exposes server-side Text-to-Speech endpoints.
POST /api/tts/generate  — Generate MP3 from advisory text + language
GET  /api/tts/audio/{filename} — Serve cached MP3 files
"""
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.services.tts_service import generate_speech, get_audio_url_path, CACHE_DIR

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tts", tags=["Text-to-Speech"])


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Advisory text to convert to speech")
    language: str = Field(default="en", description="Language code: en, hi, ml, te")


class TTSResponse(BaseModel):
    audio_url: str
    language: str
    text_length: int
    cached: bool


@router.post("/generate", response_model=TTSResponse)
async def generate_tts(request: TTSRequest):
    """Generate MP3 audio from advisory text. Returns a downloadable audio URL."""
    supported_langs = {"en", "hi", "ml", "te"}
    lang = request.language if request.language in supported_langs else "en"

    try:
        # Check cache before generation
        from app.services.tts_service import _cache_key, LANG_MAP
        lang_code = LANG_MAP.get(lang, "en")
        cache_hash = _cache_key(request.text, lang_code)
        cached_path = CACHE_DIR / f"{cache_hash}.mp3"
        was_cached = cached_path.exists()

        audio_url = get_audio_url_path(request.text, lang)

        logger.info(
            f"TTS generation complete: lang={lang}, chars={len(request.text)}, cached={was_cached}"
        )

        return TTSResponse(
            audio_url=audio_url,
            language=lang,
            text_length=len(request.text),
            cached=was_cached,
        )

    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        logger.error(f"TTS generation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate audio. Please try again.",
        )


@router.get("/audio/{filename}")
async def serve_audio(filename: str):
    """Serve a cached MP3 audio file."""
    # Sanitize filename to prevent path traversal
    safe_filename = Path(filename).name
    if not safe_filename.endswith(".mp3"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid audio file format.",
        )

    filepath = CACHE_DIR / safe_filename
    if not filepath.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found. It may have been cleared from cache.",
        )

    return FileResponse(
        path=str(filepath),
        media_type="audio/mpeg",
        filename=safe_filename,
        headers={
            "Cache-Control": "public, max-age=3600",
            "Accept-Ranges": "bytes",
        },
    )
