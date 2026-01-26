"""
Support ticket models
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class SupportCategory(str, enum.Enum):
    TECHNICAL = "technical"
    ACCOUNT = "account"
    BILLING = "billing"
    SAFETY = "safety"
    FEATURE = "feature"
    OTHER = "other"


class SupportTicket(Base):
    """Support ticket model"""
    __tablename__ = "support_tickets"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # Nullable for anonymous requests
    subject = Column(String(200), nullable=False)
    category = Column(SQLEnum(SupportCategory), nullable=False)
    message = Column(Text, nullable=False)
    email = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, server_default="open")  # open, in_progress, resolved, closed
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="support_tickets")
