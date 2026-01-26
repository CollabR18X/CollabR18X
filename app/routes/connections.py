"""
Connection routes (follows, mutes, restrictions, bookmarks, etc.)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, timedelta
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.auth import User
from app.models.connections import Follow, MutedUser, RestrictedUser, PostTag
from app.models.profile import SavedProfile
from app.models.community import ForumPost
from app.models.collaboration import Collaboration
from pydantic import BaseModel
from typing import Optional, List, Dict
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/connections", tags=["connections"])


class RestrictionUpdate(BaseModel):
    restrictions: Dict[str, bool]


# === Followers ===

@router.get("/followers")
async def get_followers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of users following the current user"""
    follows = db.query(Follow).filter(Follow.following_id == current_user.id).all()
    
    result = []
    for follow in follows:
        follower = db.query(User).filter(User.id == follow.follower_id).first()
        if follower:
            result.append({
                "id": follow.id,
                "follower": {
                    "id": follower.id,
                    "displayName": follower.display_name,
                    "firstName": follower.first_name,
                    "lastName": follower.last_name,
                    "profileImageUrl": follower.profile_image_url,
                },
                "created_at": follow.created_at.isoformat() if follow.created_at else None,
            })
    
    return result


# === Following ===

@router.get("/following")
async def get_following(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of users the current user is following"""
    follows = db.query(Follow).filter(Follow.follower_id == current_user.id).all()
    
    result = []
    for follow in follows:
        following = db.query(User).filter(User.id == follow.following_id).first()
        if following:
            result.append({
                "id": follow.id,
                "following": {
                    "id": following.id,
                    "displayName": following.display_name,
                    "firstName": following.first_name,
                    "lastName": following.last_name,
                    "profileImageUrl": following.profile_image_url,
                },
                "created_at": follow.created_at.isoformat() if follow.created_at else None,
            })
    
    return result


@router.delete("/following/{user_id}")
async def unfollow_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unfollow a user"""
    follow = db.query(Follow).filter(
        and_(Follow.follower_id == current_user.id, Follow.following_id == user_id)
    ).first()
    
    if not follow:
        raise HTTPException(status_code=404, detail="Not following this user")
    
    db.delete(follow)
    db.commit()
    return {"message": "Unfollowed successfully"}


# === Muted Users ===

@router.get("/muted")
async def get_muted_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of muted users"""
    mutes = db.query(MutedUser).filter(MutedUser.user_id == current_user.id).all()
    
    result = []
    for mute in mutes:
        muted_user = db.query(User).filter(User.id == mute.muted_user_id).first()
        if muted_user:
            result.append({
                "id": mute.id,
                "muted_user": {
                    "id": muted_user.id,
                    "displayName": muted_user.display_name,
                    "firstName": muted_user.first_name,
                    "lastName": muted_user.last_name,
                    "profileImageUrl": muted_user.profile_image_url,
                },
                "created_at": mute.created_at.isoformat() if mute.created_at else None,
            })
    
    return result


@router.delete("/muted/{user_id}")
async def unmute_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unmute a user"""
    mute = db.query(MutedUser).filter(
        and_(MutedUser.user_id == current_user.id, MutedUser.muted_user_id == user_id)
    ).first()
    
    if not mute:
        raise HTTPException(status_code=404, detail="User not muted")
    
    db.delete(mute)
    db.commit()
    return {"message": "Unmuted successfully"}


# === Restricted Users ===

@router.get("/restricted")
async def get_restricted_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of restricted users"""
    restricted = db.query(RestrictedUser).filter(RestrictedUser.user_id == current_user.id).all()
    
    result = []
    for restrict in restricted:
        restricted_user = db.query(User).filter(User.id == restrict.restricted_user_id).first()
        if restricted_user:
            result.append({
                "id": restrict.id,
                "restricted_user": {
                    "id": restricted_user.id,
                    "displayName": restricted_user.display_name,
                    "firstName": restricted_user.first_name,
                    "lastName": restricted_user.last_name,
                    "profileImageUrl": restricted_user.profile_image_url,
                },
                "restrictions": restrict.restrictions or {},
                "created_at": restrict.created_at.isoformat() if restrict.created_at else None,
            })
    
    return result


@router.put("/restricted/{user_id}")
async def update_restrictions(
    user_id: str,
    update: RestrictionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update restrictions for a restricted user"""
    restricted = db.query(RestrictedUser).filter(
        and_(RestrictedUser.user_id == current_user.id, RestrictedUser.restricted_user_id == user_id)
    ).first()
    
    if not restricted:
        # Create new restriction
        restricted = RestrictedUser(
            user_id=current_user.id,
            restricted_user_id=user_id,
            restrictions=update.restrictions
        )
        db.add(restricted)
    else:
        restricted.restrictions = update.restrictions
        restricted.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(restricted)
    return {"message": "Restrictions updated", "restrictions": restricted.restrictions}


@router.delete("/restricted/{user_id}")
async def unrestrict_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove restrictions from a user"""
    restricted = db.query(RestrictedUser).filter(
        and_(RestrictedUser.user_id == current_user.id, RestrictedUser.restricted_user_id == user_id)
    ).first()
    
    if not restricted:
        raise HTTPException(status_code=404, detail="User not restricted")
    
    db.delete(restricted)
    db.commit()
    return {"message": "User unrestricted"}


# === Recent Connections ===

@router.get("/recent")
async def get_recent_connections(
    period: str = Query("24h", regex="^(24h|week|month)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent connections based on time period"""
    # Calculate time threshold
    now = datetime.utcnow()
    if period == "24h":
        threshold = now - timedelta(hours=24)
    elif period == "week":
        threshold = now - timedelta(weeks=1)
    else:  # month
        threshold = now - timedelta(days=30)
    
    result = []
    
    # Get recent follows
    recent_follows = db.query(Follow).filter(
        and_(Follow.follower_id == current_user.id, Follow.created_at >= threshold)
    ).all()
    for follow in recent_follows:
        following = db.query(User).filter(User.id == follow.following_id).first()
        if following:
            result.append({
                "id": f"follow_{follow.id}",
                "type": "Started following",
                "user": {
                    "id": following.id,
                    "displayName": following.display_name,
                    "firstName": following.first_name,
                    "lastName": following.last_name,
                    "profileImageUrl": following.profile_image_url,
                },
                "user_id": following.id,
                "created_at": follow.created_at.isoformat() if follow.created_at else None,
            })
    
    # Get recent collaborations
    recent_collabs = db.query(Collaboration).filter(
        and_(
            or_(Collaboration.requester_id == current_user.id, Collaboration.receiver_id == current_user.id),
            Collaboration.created_at >= threshold
        )
    ).all()
    for collab in recent_collabs:
        partner_id = collab.receiver_id if collab.requester_id == current_user.id else collab.requester_id
        partner = db.query(User).filter(User.id == partner_id).first()
        if partner:
            result.append({
                "id": f"collab_{collab.id}",
                "type": "Collaboration request",
                "user": {
                    "id": partner.id,
                    "displayName": partner.display_name,
                    "firstName": partner.first_name,
                    "lastName": partner.last_name,
                    "profileImageUrl": partner.profile_image_url,
                },
                "user_id": partner.id,
                "created_at": collab.created_at.isoformat() if collab.created_at else None,
            })
    
    # Sort by created_at descending
    result.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return result


# === Bookmarks ===

@router.get("/bookmarks")
async def get_bookmarks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get bookmarked profiles (using saved_profiles table)"""
    bookmarks = db.query(SavedProfile).filter(SavedProfile.user_id == current_user.id).all()
    
    result = []
    for bookmark in bookmarks:
        saved_user = db.query(User).filter(User.id == bookmark.saved_user_id).first()
        if saved_user:
            result.append({
                "id": bookmark.id,
                "saved_user": {
                    "id": saved_user.id,
                    "displayName": saved_user.display_name,
                    "firstName": saved_user.first_name,
                    "lastName": saved_user.last_name,
                    "profileImageUrl": saved_user.profile_image_url,
                },
                "saved_user_id": saved_user.id,
                "created_at": bookmark.created_at.isoformat() if bookmark.created_at else None,
            })
    
    return result


@router.delete("/bookmarks/{user_id}")
async def remove_bookmark(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a bookmark"""
    bookmark = db.query(SavedProfile).filter(
        and_(SavedProfile.user_id == current_user.id, SavedProfile.saved_user_id == user_id)
    ).first()
    
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    db.delete(bookmark)
    db.commit()
    return {"message": "Bookmark removed"}


# === Tagged Posts ===

@router.get("/tagged")
async def get_tagged_posts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get posts where the current user is tagged"""
    tags = db.query(PostTag).filter(PostTag.tagged_user_id == current_user.id).all()
    
    result = []
    for tag in tags:
        post = db.query(ForumPost).filter(ForumPost.id == tag.post_id).first()
        if post:
            author = db.query(User).filter(User.id == post.author_id).first()
            result.append({
                "id": tag.id,
                "post_id": post.id,
                "post": {
                    "id": post.id,
                    "title": post.title,
                    "content": post.content,
                    "created_at": post.created_at.isoformat() if post.created_at else None,
                    "author": {
                        "id": author.id if author else None,
                        "displayName": author.display_name if author else None,
                        "firstName": author.first_name if author else None,
                    } if author else None,
                    "topic": {
                        "name": "Unknown",  # Would need to join with ForumTopic
                    },
                },
                "created_at": tag.created_at.isoformat() if tag.created_at else None,
            })
    
    return result
