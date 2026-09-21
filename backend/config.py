from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # MongoDB Configuration
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "tech_news_aggregator")

    # RSS Configuration
    RSS_UPDATE_INTERVAL_MINUTES: int = int(os.getenv("RSS_UPDATE_INTERVAL_MINUTES", "15"))

    # AI Summarization (optional)
    USE_AI_SUMMARY: bool = os.getenv("USE_AI_SUMMARY", "false").lower() == "true"
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "llama3-8b-8192")

    class Config:
        env_file = ".env"

def get_cors_origins() -> List[str]:
    cors_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:4173,http://localhost:3000")
    return [origin.strip() for origin in cors_str.split(",")]

settings = Settings()