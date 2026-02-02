"""
Application configuration
"""
import os
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # Database - Use SQLite for local dev if PostgreSQL not available
    # For production, set DATABASE_URL to PostgreSQL connection string
    # Render provides postgres://; SQLAlchemy expects postgresql://
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./collabr18x.db")
    
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if v and v.startswith("postgres://"):
            return "postgresql://" + v[len("postgres://") :]
        return v
    
    # Security
    SESSION_SECRET: str = os.getenv("SESSION_SECRET", "your-secret-key-change-this-in-production")
    
    # Environment
    DEBUG: bool = os.getenv("NODE_ENV", "development") != "production"
    NODE_ENV: str = os.getenv("NODE_ENV", "development")
    PORT: int = int(os.getenv("PORT", "5000"))
    # Extra CORS origins (comma-separated), e.g. https://collabr18x-web.onrender.com
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "")
    
    # Replit OIDC (optional for local dev)
    ISSUER_URL: Optional[str] = os.getenv("ISSUER_URL", "https://replit.com/oidc")
    REPL_ID: Optional[str] = os.getenv("REPL_ID")
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields to handle BOM issues


settings = Settings()
