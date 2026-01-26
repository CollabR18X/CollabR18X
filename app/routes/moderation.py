"""
Moderation routes (blocks and reports)
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


class BlockRequest(BaseModel):
    blockedId: str


class ReportRequest(BaseModel):
    reportedId: str
    reason: str
    description: Optional[str] = None


# Authentication is handled via get_current_user dependency


@router.get("/blocks")
async def get_blocks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get blocked users"""
    user_id = current_user.id
    storage = get_storage(db)
    blocks = storage.get_blocks(user_id)
    return blocks


@router.post("/blocks")
async def create_block(
    request: BlockRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Block a user"""
    user_id = current_user.id
    storage = get_storage(db)
    
    blocked_id = request.blockedId
    
    if blocked_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    
    block = storage.create_block(user_id, blocked_id)
    return block


@router.delete("/blocks/{block_id}")
async def remove_block(
    block_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a block"""
    user_id = current_user.id
    storage = get_storage(db)
    
    success = storage.remove_block(block_id)
    if not success:
        raise HTTPException(status_code=404, detail="Block not found")
    
    return {"success": success}


@router.post("/reports")
async def create_report(
    request: ReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a report"""
    user_id = current_user.id
    storage = get_storage(db)
    
    reported_id = request.reportedId
    
    if reported_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot report yourself")
    
    report = storage.create_report(
        user_id,
        reported_id,
        request.reason,
        request.description
    )
    return report
