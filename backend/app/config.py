"""
GeoSurvey Platform — Configuration
Pydantic settings loaded from environment variables.
"""

from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "GeoSurvey Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql://geosurvey:geosurvey_secret@localhost:5432/geosurvey"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # File uploads
    UPLOAD_DIR: str = str(Path(__file__).parent.parent / "uploads")
    MAX_UPLOAD_SIZE_MB: int = 100

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Report output
    REPORT_OUTPUT_DIR: str = str(Path(__file__).parent.parent / "generated_reports")

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
