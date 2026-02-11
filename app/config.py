"""
Application configuration
"""
import os
from pydantic_settings import BaseSettings
from pydantic import field_validator, computed_field
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
    # Redirect these hosts to canonical URL (comma-separated). Canonical host is collabr18x.com
    REDIRECT_HOSTS: str = os.getenv("REDIRECT_HOSTS", "collabr18x.onrender.com,collabr18x-web.onrender.com")
    CANONICAL_URL: str = os.getenv("CANONICAL_URL", "https://collabr18x.com")

    # Uploads - S3-compatible storage (recommended for production; persists across deploys)
    # Set these to use AWS S3 or Cloudflare R2. Leave unset for local disk (lost on deploy).
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION: Optional[str] = os.getenv("AWS_REGION", "auto")  # "auto" for Cloudflare R2
    S3_BUCKET: Optional[str] = os.getenv("S3_BUCKET")
    S3_ENDPOINT_URL: Optional[str] = os.getenv("S3_ENDPOINT_URL")  # For R2: https://<account_id>.r2.cloudflarestorage.com
    S3_PUBLIC_URL: Optional[str] = os.getenv("S3_PUBLIC_URL")  # Public URL base for uploaded files (e.g. R2 public bucket URL)

    # Fallback: local disk (ephemeral on Render free plan)
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    
    # Replit OIDC (optional for local dev)
    ISSUER_URL: Optional[str] = os.getenv("ISSUER_URL", "https://replit.com/oidc")
    REPL_ID: Optional[str] = os.getenv("REPL_ID")

    @computed_field
    @property
    def SECURE_COOKIES(self) -> bool:
        raw = os.getenv("SECURE_COOKIES")
        if raw is not None:
            return raw.lower() in ("true", "1", "yes")
        return not self.DEBUG  # Secure in production, not in dev
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields to handle BOM issues


settings = Settings()

# Fail fast in production if default session secret is used
_DEFAULT_SECRET = "your-secret-key-change-this-in-production"
if not settings.DEBUG and settings.SESSION_SECRET == _DEFAULT_SECRET:
    import sys
    print("FATAL: Set SESSION_SECRET in production. Do not use the default value.", file=sys.stderr)
    sys.exit(1)
