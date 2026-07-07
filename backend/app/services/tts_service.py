"""
Server-side Text-to-Speech service using gTTS (Google Translate TTS).
Generates MP3 audio files for advisory readouts in Malayalam, Hindi, Telugu, and English.
No API key required. Works identically across all client devices.
"""
import hashlib
import os
import logging
from pathlib import Path

from gtts import gTTS

logger = logging.getLogger(__name__)

# Language code mapping for gTTS
LANG_MAP = {
    "en": "en",
    "hi": "hi",
    "ml": "ml",
    "te": "te",
}

# Audio cache directory (inside backend/app/tts_cache/)
CACHE_DIR = Path(__file__).parent.parent / "tts_cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _cache_key(text: str, language: str) -> str:
    """Generate a deterministic cache key from text + language."""
    content = f"{language}:{text}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def generate_speech(text: str, language: str = "en") -> str:
    """
    Generate an MP3 audio file from text using gTTS.
    Returns the absolute file path of the generated MP3.
    Results are cached — repeated calls with the same text+language
    return the cached file instantly.
    """
    lang_code = LANG_MAP.get(language, "en")
    cache_hash = _cache_key(text, lang_code)
    filename = f"{cache_hash}.mp3"
    filepath = CACHE_DIR / filename

    # Return cached file if it exists
    if filepath.exists():
        logger.info(f"TTS cache hit for lang={lang_code}, hash={cache_hash[:12]}...")
        return str(filepath)

    # Clean text: strip markdown formatting artifacts
    clean_text = text.replace("**", "").replace("#", "").replace("*", "").replace("_", "")

    if not clean_text.strip():
        raise ValueError("Cannot generate speech from empty text.")

    logger.info(
        f"TTS generating audio: lang={lang_code}, chars={len(clean_text)}, hash={cache_hash[:12]}..."
    )

    tts = gTTS(text=clean_text, lang=lang_code, slow=False)
    tts.save(str(filepath))

    logger.info(f"TTS audio saved: {filepath} ({filepath.stat().st_size} bytes)")
    return str(filepath)


def get_audio_url_path(text: str, language: str = "en") -> str:
    """
    Generate speech and return the relative URL path for serving.
    """
    filepath = generate_speech(text, language)
    filename = os.path.basename(filepath)
    return f"/api/tts/audio/{filename}"
