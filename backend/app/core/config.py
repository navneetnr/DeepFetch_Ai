import os
from typing import Optional
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Force loading the backend-local .env with override to prevent stale/expired OS environment
# variables (e.g. an expired GROQ/OpenAI key set globally on the host) from taking precedence.
# Path: <repo>/backend/app/core/config.py -> ../.. -> <repo>/backend/.env
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
load_dotenv(dotenv_path=env_path, override=True)


class Settings(BaseSettings):
    """Application Settings managed via Pydantic BaseSettings."""

    APP_NAME: str = "DeepFetch AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # LLM Settings
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.1-70b-versatile"
    TAVILY_API_KEY: Optional[str] = None
    SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    DATABASE_URL: str = "sqlite:///./deepfetch.db"

    # Storage & Cache
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    REDIS_URL: str = "redis://localhost:6379/0"

    # Browser & Scraper Settings
    HEADLESS_BROWSER: bool = True
    BROWSER_TIMEOUT: int = 30000  # milliseconds
    MAX_SEARCH_RESULTS: int = 5
    MAX_REVISION_CYCLES: int = 2

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )


settings = Settings()
