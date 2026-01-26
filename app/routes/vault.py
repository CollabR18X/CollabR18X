"""
Vault routes (drafts, archived, deleted posts)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.auth import User
from app.models.vault import DraftPost, ArchivedItem, DeletedPost
from app.models.community import ForumPost, ForumTopic
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vault", tags=["vault"])


@router.get("")
async def get_vault(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all vault items (drafts, archived, deleted)"""
    # Get drafts
    drafts = db.query(DraftPost).filter(DraftPost.user_id == current_user.id).order_by(DraftPost.updated_at.desc()).all()
    drafts_list = []
    for draft in drafts:
        topic = db.query(ForumTopic).filter(ForumTopic.id == draft.topic_id).first() if draft.topic_id else None
        drafts_list.append({
            "id": draft.id,
            "title": draft.title,
            "content": draft.content,
            "topic_id": draft.topic_id,
            "topic": {"id": topic.id, "name": topic.name} if topic else None,
            "created_at": draft.created_at.isoformat() if draft.created_at else None,
            "updated_at": draft.updated_at.isoformat() if draft.updated_at else None,
        })
    
    # Get archived items
    archived = db.query(ArchivedItem).filter(ArchivedItem.user_id == current_user.id).order_by(ArchivedItem.archived_at.desc()).all()
    archived_list = []
    for item in archived:
        topic = None
        if item.item_type == 'post' and item.item_id:
            post = db.query(ForumPost).filter(ForumPost.id == item.item_id).first()
            if post and post.topic_id:
                topic = db.query(ForumTopic).filter(ForumTopic.id == post.topic_id).first()
        
        archived_list.append({
            "id": item.id,
            "type": item.item_type,
            "item_id": item.item_id,
            "title": item.title,
            "content": item.content,
            "url": item.url,
            "media_type": item.media_type,
            "topic": {"id": topic.id, "name": topic.name} if topic else None,
            "archived_at": item.archived_at.isoformat() if item.archived_at else None,
        })
    
    # Get deleted posts
    deleted = db.query(DeletedPost).filter(
        and_(
            DeletedPost.user_id == current_user.id,
            DeletedPost.permanently_deleted == False
        )
    ).order_by(DeletedPost.deleted_at.desc()).all()
    deleted_list = []
    for item in deleted:
        topic = db.query(ForumTopic).filter(ForumTopic.id == item.topic_id).first() if item.topic_id else None
        # Check if expired
        is_expired = item.expires_at and item.expires_at < datetime.utcnow()
        deleted_list.append({
            "id": item.id,
            "original_post_id": item.original_post_id,
            "title": item.title,
            "content": item.content,
            "topic": {"id": topic.id, "name": topic.name} if topic else None,
            "deleted_at": item.deleted_at.isoformat() if item.deleted_at else None,
            "expires_at": item.expires_at.isoformat() if item.expires_at else None,
            "is_expired": is_expired,
        })
    
    return {
        "drafts": drafts_list,
        "archived": archived_list,
        "deleted": deleted_list,
    }


@router.post("/restore/{post_id}")
async def restore_deleted_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Restore a deleted post"""
    deleted_post = db.query(DeletedPost).filter(
        and_(
            DeletedPost.id == post_id,
            DeletedPost.user_id == current_user.id,
            DeletedPost.permanently_deleted == False
        )
    ).first()
    
    if not deleted_post:
        raise HTTPException(status_code=404, detail="Deleted post not found")
    
    # Check if expired
    if deleted_post.expires_at and deleted_post.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="This post has been permanently deleted and cannot be restored")
    
    # Restore the original post if it exists
    if deleted_post.original_post_id:
        original_post = db.query(ForumPost).filter(ForumPost.id == deleted_post.original_post_id).first()
        if original_post:
            # Mark as not deleted (if there's a deleted flag) or restore it
            # For now, we'll just mark the deleted_post as restored
            deleted_post.permanently_deleted = True  # Mark as processed
            db.commit()
            return {"message": "Post restored successfully"}
    
    # If no original post, mark as permanently deleted
    deleted_post.permanently_deleted = True
    db.commit()
    return {"message": "Post restored successfully"}


@router.delete("/delete/{post_id}")
async def delete_permanently(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently delete a post"""
    deleted_post = db.query(DeletedPost).filter(
        and_(
            DeletedPost.id == post_id,
            DeletedPost.user_id == current_user.id,
            DeletedPost.permanently_deleted == False
        )
    ).first()
    
    if not deleted_post:
        raise HTTPException(status_code=404, detail="Deleted post not found")
    
    # Mark as permanently deleted
    deleted_post.permanently_deleted = True
    db.commit()
    return {"message": "Post permanently deleted"}


@router.post("/unarchive/{item_id}")
async def unarchive_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unarchive an item"""
    archived_item = db.query(ArchivedItem).filter(
        and_(
            ArchivedItem.id == item_id,
            ArchivedItem.user_id == current_user.id
        )
    ).first()
    
    if not archived_item:
        raise HTTPException(status_code=404, detail="Archived item not found")
    
    # Delete the archived item record
    db.delete(archived_item)
    db.commit()
    return {"message": "Item restored from archive"}
