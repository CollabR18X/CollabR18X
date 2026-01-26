"""
Statistics routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, or_
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.auth import User
from app.models.matching import Like, Match, Message
from app.models.community import ForumPost, PostReply, PostLike
from app.models.collaboration import Collaboration
from app.models.connections import Follow
from app.models.profile import Profile
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/statistics", tags=["statistics"])


@router.get("")
async def get_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user statistics"""
    try:
        # Profile views (would need a separate table to track this)
        profile_views = 0  # Placeholder - would need view tracking
        
        # Likes received
        likes_received = 0
        try:
            likes_received = db.query(Like).filter(Like.liked_id == current_user.id).count()
        except Exception as e:
            logger.warning(f"Error counting likes received: {str(e)}")
        
        # Likes sent
        likes_sent = 0
        try:
            likes_sent = db.query(Like).filter(Like.liker_id == current_user.id).count()
        except Exception as e:
            logger.warning(f"Error counting likes sent: {str(e)}")
        
        # Matches
        matches = 0
        try:
            matches = db.query(Match).filter(
                or_(
                    Match.user1_id == current_user.id,
                    Match.user2_id == current_user.id
                )
            ).count()
        except Exception as e:
            logger.warning(f"Error counting matches: {str(e)}")
        
        # Messages sent
        messages_sent = 0
        try:
            messages_sent = db.query(Message).filter(Message.sender_id == current_user.id).count()
        except Exception as e:
            logger.warning(f"Error counting messages sent: {str(e)}")
        
        # Messages received (messages in matches where user is not the sender)
        messages_received = 0
        try:
            # Get all matches where user is involved
            user_matches = db.query(Match).filter(
                or_(
                    Match.user1_id == current_user.id,
                    Match.user2_id == current_user.id
                )
            ).all()
            match_ids = [m.id for m in user_matches]
            if match_ids:
                # Count messages in those matches where user is not the sender
                messages_received = db.query(Message).filter(
                    Message.match_id.in_(match_ids),
                    Message.sender_id != current_user.id
                ).count()
        except Exception as e:
            logger.warning(f"Error counting messages received: {str(e)}")
        
        # Posts created
        posts_created = 0
        try:
            posts_created = db.query(ForumPost).filter(ForumPost.author_id == current_user.id).count()
        except Exception as e:
            logger.warning(f"Error counting posts created: {str(e)}")
        
        # Post likes received
        post_likes = 0
        try:
            user_posts = db.query(ForumPost).filter(ForumPost.author_id == current_user.id).all()
            post_ids = [post.id for post in user_posts]
            if post_ids:
                post_likes = db.query(PostLike).filter(PostLike.post_id.in_(post_ids)).count()
        except Exception as e:
            logger.warning(f"Error counting post likes: {str(e)}")
            post_likes = 0
        
        # Post replies received
        post_replies = 0
        try:
            user_posts = db.query(ForumPost).filter(ForumPost.author_id == current_user.id).all()
            post_ids = [post.id for post in user_posts]
            if post_ids:
                post_replies = db.query(PostReply).filter(PostReply.post_id.in_(post_ids)).count()
        except Exception as e:
            logger.warning(f"Error counting post replies: {str(e)}")
            post_replies = 0
        
        # Collaborations
        collaborations = 0
        try:
            collaborations = db.query(Collaboration).filter(
                or_(
                    Collaboration.requester_id == current_user.id,
                    Collaboration.receiver_id == current_user.id
                )
            ).count()
        except Exception as e:
            logger.warning(f"Error counting collaborations: {str(e)}")
        
        # Collaboration requests sent
        collaboration_requests_sent = 0
        try:
            collaboration_requests_sent = db.query(Collaboration).filter(
                Collaboration.requester_id == current_user.id
            ).count()
        except Exception as e:
            logger.warning(f"Error counting collaboration requests sent: {str(e)}")
        
        # Collaboration requests received
        collaboration_requests_received = 0
        try:
            collaboration_requests_received = db.query(Collaboration).filter(
                Collaboration.receiver_id == current_user.id
            ).count()
        except Exception as e:
            logger.warning(f"Error counting collaboration requests received: {str(e)}")
        
        # Followers
        followers = 0
        try:
            followers = db.query(Follow).filter(Follow.following_id == current_user.id).count()
        except Exception as e:
            logger.warning(f"Error counting followers: {str(e)}")
        
        # Following
        following = 0
        try:
            following = db.query(Follow).filter(Follow.follower_id == current_user.id).count()
        except Exception as e:
            logger.warning(f"Error counting following: {str(e)}")
        
        # Account created date
        account_created_at = current_user.created_at.isoformat() if current_user.created_at else None
        
        # Last active (from profile)
        profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
        last_active = profile.last_active.isoformat() if profile and profile.last_active else account_created_at
        
        # Profile completion (calculate based on filled fields)
        profile_completion = 0
        if profile:
            fields = [
                profile.bio, profile.niche, profile.location,
                profile.birth_date, profile.gender, profile.looking_for,
                profile.interests, profile.occupation, profile.education
            ]
            filled = sum(1 for field in fields if field)
            profile_completion = int((filled / len(fields)) * 100)
        
        # Response rate (messages replied to / messages received)
        response_rate = 0
        if messages_received > 0:
            # This would need a more sophisticated calculation
            # For now, estimate based on messages sent vs received
            response_rate = min(100, int((messages_sent / max(messages_received, 1)) * 100))
        
        return {
            "profileViews": profile_views,
            "likesReceived": likes_received,
            "likesSent": likes_sent,
            "matches": matches,
            "messagesSent": messages_sent,
            "messagesReceived": messages_received,
            "postsCreated": posts_created,
            "postLikes": post_likes,
            "postReplies": post_replies,
            "collaborations": collaborations,
            "collaborationRequestsSent": collaboration_requests_sent,
            "collaborationRequestsReceived": collaboration_requests_received,
            "followers": followers,
            "following": following,
            "accountCreatedAt": account_created_at,
            "lastActive": last_active,
            "profileCompletion": profile_completion,
            "responseRate": response_rate,
        }
        
    except Exception as e:
        logger.error(f"Error getting statistics: {str(e)}", exc_info=True)
        # Return empty statistics instead of raising error to prevent infinite retries
        return {
            "profileViews": 0,
            "likesReceived": 0,
            "likesSent": 0,
            "matches": 0,
            "messagesSent": 0,
            "messagesReceived": 0,
            "postsCreated": 0,
            "postLikes": 0,
            "postReplies": 0,
            "collaborations": 0,
            "collaborationRequestsSent": 0,
            "collaborationRequestsReceived": 0,
            "followers": 0,
            "following": 0,
            "accountCreatedAt": None,
            "lastActive": None,
            "profileCompletion": 0,
            "responseRate": 0,
        }
