"""
Matching and messaging routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.storage_service import get_storage
from app.middleware.auth import get_current_user, require_auth
from app.models.auth import User
from pydantic import BaseModel
from typing import Optional
import time

router = APIRouter()

# Rate limiting for messages - 30 messages per minute per user
message_rate_limits = {}
MESSAGE_RATE_LIMIT = 30
MESSAGE_RATE_WINDOW = 60  # 1 minute in seconds


def check_message_rate_limit(user_id: str) -> bool:
    """Check if user has exceeded message rate limit"""
    now = time.time()
    user_limit = message_rate_limits.get(user_id)
    
    if not user_limit or now > user_limit["reset_time"]:
        message_rate_limits[user_id] = {"count": 1, "reset_time": now + MESSAGE_RATE_WINDOW}
        return True
    
    if user_limit["count"] >= MESSAGE_RATE_LIMIT:
        return False
    
    user_limit["count"] += 1
    return True


class LikeRequest(BaseModel):
    likedId: str
    isSuperLike: Optional[bool] = False


class MessageRequest(BaseModel):
    content: str
    encrypted_content: Optional[str] = None
    nonce: Optional[str] = None


# Authentication is handled via get_current_user dependency


@router.post("/likes")
async def create_like(
    request: LikeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a like"""
    user_id = current_user.id
    liked_id = request.likedId
    
    if liked_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot like yourself")
    
    storage = get_storage(db)
    
    # Check if blocked
    if storage.is_blocked(user_id, liked_id):
        raise HTTPException(status_code=400, detail="Cannot like this user")
    
    # Check if already liked
    if storage.has_liked(user_id, liked_id):
        raise HTTPException(status_code=400, detail="Already liked this user")
    
    # Create like
    is_super_like = request.isSuperLike or False
    like = storage.create_like(user_id, liked_id, is_super_like)
    
    # Check for mutual like
    if storage.check_mutual_like(user_id, liked_id):
        match = storage.create_match(user_id, liked_id)
        return {"match": match, "like": like}
    
    return like


@router.get("/likes/received")
async def get_likes_received(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get likes received"""
    user_id = current_user.id
    storage = get_storage(db)
    likes = storage.get_likes_received(user_id)
    return likes


@router.post("/likes/pass")
async def pass_like():
    """Pass on a like"""
    return {"success": True}


@router.get("/matches")
async def get_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all matches"""
    user_id = current_user.id
    storage = get_storage(db)
    matches = storage.get_matches(user_id)
    return matches


@router.get("/matches/{match_id}")
async def get_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a match by ID"""
    user_id = current_user.id
    storage = get_storage(db)
    
    if not storage.is_user_in_match(user_id, match_id):
        raise HTTPException(status_code=403, detail="Not authorized to view this match")
    
    match = storage.get_match(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    return match


@router.delete("/matches/{match_id}")
async def delete_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Unmatch users"""
    user_id = current_user.id
    storage = get_storage(db)
    
    if not storage.is_user_in_match(user_id, match_id):
        raise HTTPException(status_code=403, detail="Not authorized to unmatch")
    
    success = storage.unmatch(match_id)
    return {"success": success}


@router.post("/matches/{match_id}/messages")
async def send_message(
    match_id: int,
    request: MessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a message"""
    user_id = current_user.id
    storage = get_storage(db)
    
    # Rate limiting
    if not check_message_rate_limit(user_id):
        raise HTTPException(status_code=429, detail="Too Many Requests. Please slow down.")
    
    # Verify user is part of match
    match = storage.get_match(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    if not match.is_active:
        raise HTTPException(status_code=403, detail="This match is no longer active")
    
    if match.user1_id != user_id and match.user2_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to send messages in this match")
    
    # Send message
    message = storage.send_message(match_id, user_id, request.content)
    return message


@router.get("/matches/{match_id}/messages")
async def get_messages(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get messages for a match"""
    user_id = current_user.id
    storage = get_storage(db)
    
    if not storage.is_user_in_match(user_id, match_id):
        raise HTTPException(status_code=403, detail="Not authorized to view messages")
    
    messages = storage.get_messages(match_id)
    return messages


@router.post("/matches/{match_id}/messages/read")
async def mark_messages_as_read(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark messages as read"""
    user_id = current_user.id
    storage = get_storage(db)
    
    if not storage.is_user_in_match(user_id, match_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    success = storage.mark_messages_as_read(match_id, user_id)
    return {"success": success}
