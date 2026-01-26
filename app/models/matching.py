"""
Matching and messaging models
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Like(Base):
    """Like model"""
    __tablename__ = "likes"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    liker_id = Column(String, ForeignKey("users.id"), nullable=False)
    liked_id = Column(String, ForeignKey("users.id"), nullable=False)
    is_super_like = Column(Boolean, nullable=False, server_default="false")
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    liker = relationship("User", foreign_keys=[liker_id], back_populates="sent_likes")
    liked = relationship("User", foreign_keys=[liked_id], back_populates="received_likes")


class Match(Base):
    """Match model"""
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user1_id = Column(String, ForeignKey("users.id"), nullable=False)
    user2_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, nullable=False, server_default="true")
    
    # Relationships (set up in __init__.py)


class Message(Base):
    """Message model"""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String, nullable=False, server_default="text")
    media_url = Column(String, nullable=True)
    media_thumbnail = Column(String, nullable=True)
    is_encrypted = Column(Boolean, nullable=False, server_default="true")
    encrypted_content = Column(Text, nullable=True)
    nonce = Column(String, nullable=True)
    encrypted_at = Column(DateTime, nullable=True)
    is_read = Column(Boolean, nullable=False, server_default="false")
    is_moderated = Column(Boolean, nullable=False, server_default="false")
    moderation_status = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships (set up in __init__.py)
