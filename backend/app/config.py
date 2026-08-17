import os
from pydantic_settings import BaseSettings

# Load .env file manually into os.environ if it exists
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip().strip('"').strip("'")

class Settings(BaseSettings):
    PROJECT_NAME: str = "PillSync API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "pillsync-super-secret-key-change-me-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./pillsync.db")

    class Config:
        case_sensitive = True

settings = Settings()
