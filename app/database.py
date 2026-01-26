"""
Database connection and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from app.config import settings

if not settings.DATABASE_URL:
    raise ValueError("DATABASE_URL must be set. Did you forget to provision a database?")

# Create engine - use SQLite for local dev, PostgreSQL for production
# SQLite needs connect_args for foreign keys and check_same_thread=False for async
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        poolclass=NullPool,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        poolclass=NullPool,
        echo=settings.DEBUG
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


async def init_db():
    """Initialize database connection"""
    # Test connection (no commit needed for SELECT)
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        # No commit needed for read-only operations


def get_db() -> Session:
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
