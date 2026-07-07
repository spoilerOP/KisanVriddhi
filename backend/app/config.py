import os
import secrets
import logging
from pydantic_settings import BaseSettings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./kisan_alert.db"
    JWT_SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    GEMINI_API_KEY: str = ""
    ENV: str = "development"
    PORT: int = 8000
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_BYTES: int = 5 * 1024 * 1024  # 5MB limits

    class Config:
        env_file = ("../.env", ".env")
        extra = "ignore"

settings = Settings()

# Check and validate secret key
if not settings.JWT_SECRET_KEY or settings.JWT_SECRET_KEY == "replace_this_with_a_secure_long_secret_key_in_production":
    logger.severe = logger.warning # Support severe warning
    logger.warning("WARNING: JWT_SECRET_KEY is not set or using default value. Generating ephemeral secret key. Note: This will invalidate sessions on restart!")
    settings.JWT_SECRET_KEY = secrets.token_hex(32)
