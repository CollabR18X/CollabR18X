"""
Connection models (follows, mutes, restrictions, etc.)
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Follow(Base):
    """Follow relationship model"""
    __tablename__ = "follows"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    follower_id = Column(String, ForeignKey("users.id"), nullable=False)
    following_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    follower = relationship("User", foreign_keys=[follower_id])
    following = relationship("User", foreign_keys=[following_id])


class MutedUser(Base):
    """Muted user model"""
    __tablename__ = "muted_users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    muted_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="muted_users")
    muted_user = relationship("User", foreign_keys=[muted_user_id])


class RestrictedUser(Base):
    """Restricted user model"""
    __tablename__ = "restricted_users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    restricted_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    restrictions = Column(JSON, nullable=False, server_default="{}")  # {noMessages: bool, noProfileView: bool, noCollaborations: bool}
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="restricted_users")
    restricted_user = relationship("User", foreign_keys=[restricted_user_id])


class PostTag(Base):
    """Post tag model - tracks when users are tagged in posts"""
    __tablename__ = "post_tags"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("forum_posts.id"), nullable=False)
    tagged_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    post = relationship("ForumPost", foreign_keys=[post_id])
    tagged_user = relationship("User", foreign_keys=[tagged_user_id], back_populates="post_tags")
