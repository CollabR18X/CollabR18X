"""
Collaboration models
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Collaboration(Base):
    """Collaboration request model"""
    __tablename__ = "collaborations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    requester_id = Column(String, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False, server_default="pending")
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    acknowledged_by_requester = Column(Boolean, nullable=False, server_default="false")
    acknowledged_by_receiver = Column(Boolean, nullable=False, server_default="false")
    
    # Relationships
    requester = relationship("User", foreign_keys=[requester_id], back_populates="sent_collaborations")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_collaborations")
    workspace = relationship("CollaborationWorkspace", back_populates="collaboration", uselist=False)


class CollaborationWorkspace(Base):
    """Collaboration workspace model"""
    __tablename__ = "collaboration_workspaces"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    collaboration_id = Column(Integer, ForeignKey("collaborations.id"), nullable=False, unique=True)
    concept = Column(Text, nullable=True)
    shoot_dates = Column(JSON, nullable=True, server_default="[]")
    location = Column(String, nullable=True)
    location_details = Column(Text, nullable=True)
    roles = Column(JSON, nullable=True, server_default="[]")
    revenue_split = Column(JSON, nullable=True)
    boundaries_acknowledged = Column(JSON, nullable=True, server_default='{"user1Acknowledged": false, "user2Acknowledged": false}')
    consent_checklist_completed = Column(Boolean, nullable=False, server_default="false")
    testing_discussion_confirmed = Column(Boolean, nullable=False, server_default="false")
    testing_discussion_notes = Column(Text, nullable=True)
    agreement_exported = Column(Boolean, nullable=False, server_default="false")
    agreement_export_url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    attachments = Column(JSON, nullable=False, server_default="[]")  # JSON array for SQLite compatibility
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    collaboration = relationship("Collaboration", back_populates="workspace")


class CollabTemplate(Base):
    """Collaboration template model"""
    __tablename__ = "collab_templates"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    is_default = Column(Boolean, nullable=False, server_default="false")
