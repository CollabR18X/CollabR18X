"""
Community models (forums, events, safety alerts)
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ForumTopic(Base):
    """Forum topic model"""
    __tablename__ = "forum_topics"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    posts = relationship("ForumPost", back_populates="topic")


class ForumPost(Base):
    """Forum post model"""
    __tablename__ = "forum_posts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    topic_id = Column(Integer, ForeignKey("forum_topics.id"), nullable=False)
    author_id = Column(String, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, nullable=False, server_default="false")
    is_pinned = Column(Boolean, nullable=False, server_default="false")
    likes_count = Column(Integer, nullable=False, server_default="0")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    topic = relationship("ForumTopic", back_populates="posts")
    replies = relationship("PostReply", back_populates="post")


class PostReply(Base):
    """Forum post reply model"""
    __tablename__ = "post_replies"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("forum_posts.id"), nullable=False)
    author_id = Column(String, ForeignKey("users.id"), nullable=True)
    content = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, nullable=False, server_default="false")
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    post = relationship("ForumPost", back_populates="replies")


class PostLike(Base):
    """Post like model - tracks which users liked which posts"""
    __tablename__ = "post_likes"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("forum_posts.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    post = relationship("ForumPost")
    user = relationship("User")


class Event(Base):
    """Event model"""
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    creator_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    event_date = Column(DateTime, nullable=False)
    is_virtual = Column(Boolean, nullable=False, server_default="false")
    virtual_link = Column(String, nullable=True)
    max_attendees = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships (set up in __init__.py)


class EventAttendee(Base):
    """Event attendee model"""
    __tablename__ = "event_attendees"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships (set up in __init__.py)


class SafetyAlert(Base):
    """Safety alert model"""
    __tablename__ = "safety_alerts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    reporter_id = Column(String, ForeignKey("users.id"), nullable=False)
    alert_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    evidence_urls = Column(JSON, nullable=False, server_default="[]")  # JSON array for SQLite compatibility
    suspect_name = Column(String, nullable=True)
    suspect_handle = Column(String, nullable=True)
    is_verified = Column(Boolean, nullable=False, server_default="false")
    is_resolved = Column(Boolean, nullable=False, server_default="false")
    created_at = Column(DateTime, server_default=func.now())
