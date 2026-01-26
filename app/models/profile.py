"""
Profile models
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from typing import Optional, Dict, List


class Profile(Base):
    """User profile model"""
    __tablename__ = "profiles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    bio = Column(String, nullable=True)
    niche = Column(String, nullable=True)
    portfolio_url = Column(String, nullable=True)
    location = Column(String, nullable=True)
    social_links = Column(JSON, nullable=True)  # JSONB in PostgreSQL
    age_verified = Column(Boolean, nullable=False, server_default="false")
    socials_verified = Column(Boolean, nullable=False, server_default="false")
    tags = Column(JSON, nullable=False, server_default="[]")  # JSON array for SQLite compatibility
    is_nsfw = Column(Boolean, nullable=False, server_default="false")
    birth_date = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    looking_for = Column(String, nullable=True)
    interests = Column(JSON, nullable=False, server_default="[]")  # JSON array for SQLite compatibility
    relationship_type = Column(String, nullable=True)
    height = Column(Integer, nullable=True)
    occupation = Column(String, nullable=True)
    education = Column(String, nullable=True)
    photos = Column(JSON, nullable=False, server_default="[]")  # JSON array for SQLite compatibility
    is_visible = Column(Boolean, nullable=False, server_default="true")
    last_active = Column(DateTime, server_default=func.now())
    privacy_settings = Column(JSON, nullable=True, server_default="{}")
    min_age_preference = Column(Integer, server_default="18")
    max_age_preference = Column(Integer, server_default="99")
    max_distance = Column(Integer, server_default="100")
    gender_preference = Column(JSON, nullable=False, server_default="[]")  # JSON array for SQLite compatibility
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_updated_at = Column(DateTime, nullable=True)
    boundaries = Column(JSON, nullable=True, server_default="{}")
    consent_acknowledged_at = Column(DateTime, nullable=True)
    experience_level = Column(String, nullable=True)
    availability = Column(String, nullable=True)
    travel_mode = Column(String, nullable=True)
    monetization_expectation = Column(String, nullable=True)
    
    # Additional fields from requirements
    username = Column(String, nullable=True)
    content_style = Column(String, nullable=True)
    genders = Column(JSON, nullable=False, server_default="[]")  # JSON array for SQLite compatibility
    collab_payment_preference = Column(String, nullable=True)
    stage_name = Column(String, nullable=True)
    is_creator_verified = Column(Boolean, nullable=False, server_default="false")
    testing_status_disclosed = Column(Boolean, nullable=False, server_default="false")
    testing_status = Column(String, nullable=True)
    preferred_language = Column(String, server_default="'en'")
    
    # Relationships
    user = relationship("User", back_populates="profile")


class SavedProfile(Base):
    """Saved profiles model"""
    __tablename__ = "saved_profiles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    saved_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
