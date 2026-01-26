"""
Moderation models
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Block(Base):
    """Block model"""
    __tablename__ = "blocks"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    blocker_id = Column(String, ForeignKey("users.id"), nullable=False)
    blocked_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class Report(Base):
    """Report model"""
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    reporter_id = Column(String, ForeignKey("users.id"), nullable=False)
    reported_id = Column(String, ForeignKey("users.id"), nullable=False)
    reason = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, server_default="pending")
    created_at = Column(DateTime, server_default=func.now())
