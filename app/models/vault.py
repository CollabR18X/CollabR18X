"""
Vault models (drafts, archived, deleted posts)
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class DraftPost(Base):
    """Draft post model"""
    __tablename__ = "draft_posts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("forum_topics.id"), nullable=True)
    title = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="draft_posts")
    topic = relationship("ForumTopic", foreign_keys=[topic_id])


class ArchivedItem(Base):
    """Archived item model (posts or media)"""
    __tablename__ = "archived_items"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    item_type = Column(String, nullable=False)  # 'post' or 'media'
    item_id = Column(Integer, nullable=False)  # ID of the post or media
    title = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    url = Column(String, nullable=True)  # For media items
    media_type = Column(String, nullable=True)  # 'image', 'video', 'audio', etc.
    item_metadata = Column(JSON, nullable=True)  # Additional metadata (renamed from 'metadata' to avoid SQLAlchemy conflict)
    archived_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="archived_items")


class DeletedPost(Base):
    """Deleted post model (soft delete with expiration)"""
    __tablename__ = "deleted_posts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    original_post_id = Column(Integer, ForeignKey("forum_posts.id"), nullable=True)
    topic_id = Column(Integer, ForeignKey("forum_topics.id"), nullable=True)
    title = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    deleted_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=False)  # 30 days from deletion
    permanently_deleted = Column(Boolean, nullable=False, server_default="false")
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="deleted_posts")
    topic = relationship("ForumTopic", foreign_keys=[topic_id])
