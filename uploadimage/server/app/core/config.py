from functools import lru_cache
from pathlib import Path

from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration driven by environment variables."""

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.0-flash"  # Try 2.0-flash which may have different quota limits
    llm_provider: Literal["google", "openrouter"] = "google"
    enable_ocr_fallback: bool = True
    allowed_origins_raw: str = "http://localhost:5173"
    openrouter_api_base: str = "https://openrouter.ai/api/v1"
    request_timeout_seconds: int = 60
    client_app_title: str = "Gemini Receipt Analyzer"
    client_app_url: str | None = "http://localhost:5173"

    _root = Path(__file__).resolve().parents[2]
    model_config = SettingsConfigDict(
        env_file=str(_root / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins_raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
