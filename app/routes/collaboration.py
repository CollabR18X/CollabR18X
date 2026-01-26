"""
Collaboration routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.storage_service import get_storage
from app.middleware.auth import get_current_user
from app.models.auth import User
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class CollaborationRequest(BaseModel):
    receiverId: str
    message: str


class CollaborationStatusUpdate(BaseModel):
    status: str


# Authentication is handled via get_current_user dependency


@router.get("/collaborations")
async def get_collaborations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get collaborations for current user"""
    user_id = current_user.id
    storage = get_storage(db)
    collaborations = storage.get_collaborations_for_user(user_id)
    return collaborations


@router.post("/collaborations")
async def create_collaboration(
    request: CollaborationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a collaboration request"""
    user_id = current_user.id
    storage = get_storage(db)
    
    receiver_id = request.receiverId
    
    if receiver_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot collaborate with yourself")
    
    # Check if blocked
    if storage.is_blocked(user_id, receiver_id):
        raise HTTPException(status_code=400, detail="Cannot send collaboration request")
    
    collab = storage.create_collaboration(user_id, receiver_id, request.message)
    return collab


@router.patch("/collaborations/{collab_id}/status")
async def update_collaboration_status(
    collab_id: int,
    update: CollaborationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update collaboration status"""
    user_id = current_user.id
    storage = get_storage(db)
    
    collab = storage.update_collaboration_status(collab_id, update.status)
    if not collab:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    
    return collab


@router.post("/collaborations/{collab_id}/acknowledge")
async def acknowledge_collaboration(
    collab_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Acknowledge a collaboration"""
    user_id = current_user.id
    storage = get_storage(db)
    
    collab = storage.acknowledge_collaboration(collab_id, user_id)
    if not collab:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    
    return collab
