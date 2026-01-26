"""
Application configuration
"""
import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # Database - Use SQLite for local dev if PostgreSQL not available
    # For production, set DATABASE_URL to PostgreSQL connection string
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./collabr18x.db")
    
    # Security
    SESSION_SECRET: str = os.getenv("SESSION_SECRET", "your-secret-key-change-this-in-production")
    
    # Environment
    DEBUG: bool = os.getenv("NODE_ENV", "development") != "production"
    NODE_ENV: str = os.getenv("NODE_ENV", "development")
    PORT: int = int(os.getenv("PORT", "5000"))
    
    # Replit OIDC (optional for local dev)
    ISSUER_URL: Optional[str] = os.getenv("ISSUER_URL", "https://replit.com/oidc")
    REPL_ID: Optional[str] = os.getenv("REPL_ID")
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields to handle BOM issues


settings = Settings()
