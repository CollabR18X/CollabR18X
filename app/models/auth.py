"""
Authentication and user models
"""
from sqlalchemy import Column, String, DateTime, func, Text
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
from typing import Optional
import uuid


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    display_name = Column(String, nullable=True)  # Custom display name
    profile_image_url = Column(String, nullable=True)
    password = Column(String, nullable=True)  # For local auth
    # username = Column(String, unique=True, nullable=True)  # Commented out - column doesn't exist in DB yet
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False)
    sent_likes = relationship("Like", foreign_keys="Like.liker_id", back_populates="liker")
    received_likes = relationship("Like", foreign_keys="Like.liked_id", back_populates="liked")
    sent_collaborations = relationship("Collaboration", foreign_keys="Collaboration.requester_id", back_populates="requester")
    received_collaborations = relationship("Collaboration", foreign_keys="Collaboration.receiver_id", back_populates="receiver")
    support_tickets = relationship("SupportTicket", back_populates="user")
    followers = relationship("Follow", foreign_keys="Follow.following_id", back_populates="following")
    following = relationship("Follow", foreign_keys="Follow.follower_id", back_populates="follower")
    muted_users = relationship("MutedUser", foreign_keys="MutedUser.user_id", back_populates="user")
    restricted_users = relationship("RestrictedUser", foreign_keys="RestrictedUser.user_id", back_populates="user")
    post_tags = relationship("PostTag", foreign_keys="PostTag.tagged_user_id", back_populates="tagged_user")
    draft_posts = relationship("DraftPost", foreign_keys="DraftPost.user_id", back_populates="user")
    archived_items = relationship("ArchivedItem", foreign_keys="ArchivedItem.user_id", back_populates="user")
    deleted_posts = relationship("DeletedPost", foreign_keys="DeletedPost.user_id", back_populates="user")


class Session(Base):
    """Session storage table for Replit Auth"""
    __tablename__ = "sessions"
    
    sid = Column(String, primary_key=True)
    sess = Column(String)  # JSON stored as string
    expire = Column(DateTime, nullable=False)
