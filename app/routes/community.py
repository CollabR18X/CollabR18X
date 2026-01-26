"""
Community routes (forums, events, safety alerts)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.database import get_db
from app.models.community import ForumPost, ForumTopic, PostReply, PostLike
from app.models.auth import User
from app.middleware.auth import get_current_user, get_current_user_id
from fastapi import Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

router = APIRouter()


class CreatePostRequest(BaseModel):
    title: str
    content: str
    isAnonymous: Optional[bool] = False


class CreateReplyRequest(BaseModel):
    content: str
    isAnonymous: Optional[bool] = False


class CreateForumTopicRequest(BaseModel):
    name: str
    description: str
    icon: Optional[str] = "📝"


def get_or_create_general_topic(db: Session) -> ForumTopic:
    """Get or create the General Feed topic"""
    topic = db.query(ForumTopic).filter(ForumTopic.name == "General Feed").first()
    if not topic:
        topic = ForumTopic(
            name="General Feed",
            description="General posts from creators",
            icon="📝"
        )
        db.add(topic)
        db.commit()
        db.refresh(topic)
    return topic


@router.get("/feed")
async def get_feed(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Get feed of creator posts"""
    # Get current user if authenticated (optional)
    current_user = None
    try:
        if request:
            user_id = get_current_user_id(request, db)
            if user_id:
                current_user = db.query(User).filter(User.id == user_id).first()
    except:
        pass  # User not authenticated, continue without user
    """Get feed of creator posts"""
    try:
        # Get recent forum posts with author and topic info
        posts = db.query(ForumPost)\
            .join(ForumTopic, ForumPost.topic_id == ForumTopic.id)\
            .outerjoin(User, ForumPost.author_id == User.id)\
            .order_by(desc(ForumPost.created_at))\
            .limit(limit)\
            .offset(offset)\
            .all()
        
        # Get reply counts for each post
        reply_counts = db.query(
            PostReply.post_id,
            func.count(PostReply.id).label('count')
        ).group_by(PostReply.post_id).all()
        
        reply_count_map = {post_id: count for post_id, count in reply_counts}
        
        # Get liked posts for current user if authenticated
        liked_post_ids = set()
        if current_user:
            liked_posts = db.query(PostLike.post_id).filter(
                PostLike.user_id == current_user.id,
                PostLike.post_id.in_([p.id for p in posts])
            ).all()
            liked_post_ids = {post_id for (post_id,) in liked_posts}
        
        result = []
        for post in posts:
            post_data: Dict[str, Any] = {
                "id": post.id,
                "title": post.title,
                "content": post.content,
                "authorId": post.author_id,
                "likesCount": post.likes_count or 0,
                "repliesCount": reply_count_map.get(post.id, 0),
                "createdAt": post.created_at.isoformat() if post.created_at else None,
                "isAnonymous": post.is_anonymous,
                "isLiked": post.id in liked_post_ids if current_user else False,
            }
            
            # Add author info if not anonymous
            if not post.is_anonymous and post.author_id:
                author = db.query(User).filter(User.id == post.author_id).first()
                if author:
                    post_data["author"] = {
                        "id": author.id,
                        "firstName": author.first_name,
                        "lastName": author.last_name,
                        "profileImageUrl": author.profile_image_url
                    }
            
            # Add topic info
            if post.topic:
                post_data["topic"] = {
                    "id": post.topic.id,
                    "name": post.topic.name
                }
            
            result.append(post_data)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch feed: {str(e)}")


class CreatePostRequest(BaseModel):
    title: str
    content: str
    isAnonymous: Optional[bool] = False


@router.post("/posts")
async def create_post(
    request: CreatePostRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new post"""
    try:
        # Get or create General Feed topic
        topic = get_or_create_general_topic(db)
        
        # Create post
        post = ForumPost(
            topic_id=topic.id,
            author_id=None if request.isAnonymous else current_user.id,
            title=request.title,
            content=request.content,
            is_anonymous=request.isAnonymous or False
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        
        # Return post with author and topic info
        post_data: Dict[str, Any] = {
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "authorId": post.author_id,
            "likesCount": post.likes_count or 0,
            "repliesCount": 0,
            "createdAt": post.created_at.isoformat() if post.created_at else None,
            "isAnonymous": post.is_anonymous,
        }
        
        if not post.is_anonymous and post.author_id:
            author = db.query(User).filter(User.id == post.author_id).first()
            if author:
                post_data["author"] = {
                    "id": author.id,
                    "firstName": author.first_name,
                    "lastName": author.last_name,
                    "profileImageUrl": author.profile_image_url
                }
        
        post_data["topic"] = {
            "id": topic.id,
            "name": topic.name
        }
        
        return post_data
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create post: {str(e)}")


@router.get("/posts/user/{user_id}")
async def get_user_posts(
    user_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get posts by a specific user"""
    try:
        posts = db.query(ForumPost)\
            .filter(ForumPost.author_id == user_id)\
            .filter(ForumPost.is_anonymous == False)\
            .join(ForumTopic, ForumPost.topic_id == ForumTopic.id)\
            .order_by(desc(ForumPost.created_at))\
            .limit(limit)\
            .offset(offset)\
            .all()
        
        # Get reply counts
        reply_counts = db.query(
            PostReply.post_id,
            func.count(PostReply.id).label('count')
        ).group_by(PostReply.post_id).all()
        
        reply_count_map = {post_id: count for post_id, count in reply_counts}
        
        result = []
        for post in posts:
            post_data: Dict[str, Any] = {
                "id": post.id,
                "title": post.title,
                "content": post.content,
                "authorId": post.author_id,
                "likesCount": post.likes_count or 0,
                "repliesCount": reply_count_map.get(post.id, 0),
                "createdAt": post.created_at.isoformat() if post.created_at else None,
                "isAnonymous": False,
            }
            
            author = db.query(User).filter(User.id == post.author_id).first()
            if author:
                post_data["author"] = {
                    "id": author.id,
                    "firstName": author.first_name,
                    "lastName": author.last_name,
                    "profileImageUrl": author.profile_image_url
                }
            
            if post.topic:
                post_data["topic"] = {
                    "id": post.topic.id,
                    "name": post.topic.name
                }
            
            result.append(post_data)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user posts: {str(e)}")


@router.get("/forums")
async def get_forums(db: Session = Depends(get_db)):
    """Get all forum topics with post counts"""
    try:
        topics = db.query(ForumTopic).order_by(ForumTopic.created_at).all()
        
        result = []
        for topic in topics:
            # Get post count for this topic
            post_count = db.query(func.count(ForumPost.id)).filter(
                ForumPost.topic_id == topic.id
            ).scalar() or 0
            
            result.append({
                "id": topic.id,
                "name": topic.name,
                "description": topic.description,
                "icon": topic.icon,
                "createdAt": topic.created_at.isoformat() if topic.created_at else None,
                "postCount": post_count
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch forums: {str(e)}")


@router.post("/forums")
async def create_forum_topic(
    request: CreateForumTopicRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new forum topic"""
    try:
        # Validate input
        name = request.name.strip()
        description = request.description.strip()
        icon = request.icon.strip() if request.icon else "📝"
        
        if not name:
            raise HTTPException(status_code=400, detail="Forum name is required")
        if not description:
            raise HTTPException(status_code=400, detail="Forum description is required")
        
        # Check if topic with same name already exists
        existing = db.query(ForumTopic).filter(ForumTopic.name == name).first()
        if existing:
            raise HTTPException(status_code=400, detail="A forum with this name already exists")
        
        # Create new topic
        topic = ForumTopic(
            name=name,
            description=description,
            icon=icon
        )
        db.add(topic)
        db.commit()
        db.refresh(topic)
        
        return {
            "id": topic.id,
            "name": topic.name,
            "description": topic.description,
            "icon": topic.icon,
            "createdAt": topic.created_at.isoformat() if topic.created_at else None,
            "postCount": 0
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create forum topic: {str(e)}")


@router.get("/forums/topics")
async def get_forum_topics(db: Session = Depends(get_db)):
    """Get forum topics (alias for /forums)"""
    return await get_forums(db)


@router.get("/forums/posts")
async def get_forum_posts(
    topic_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get forum posts"""
    # TODO: Implement
    return []


@router.get("/events")
async def get_events(db: Session = Depends(get_db)):
    """Get events"""
    # TODO: Implement
    return []


@router.get("/safety-alerts")
async def get_safety_alerts(db: Session = Depends(get_db)):
    """Get safety alerts"""
    # TODO: Implement
    return []


@router.post("/posts/{post_id}/like")
async def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Like or unlike a post"""
    try:
        post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check if user already liked this post
        existing_like = db.query(PostLike).filter(
            PostLike.post_id == post_id,
            PostLike.user_id == current_user.id
        ).first()
        
        if existing_like:
            # Unlike: remove the like
            db.delete(existing_like)
            post.likes_count = max(0, (post.likes_count or 0) - 1)
            is_liked = False
        else:
            # Like: add the like
            new_like = PostLike(
                post_id=post_id,
                user_id=current_user.id
            )
            db.add(new_like)
            post.likes_count = (post.likes_count or 0) + 1
            is_liked = True
        
        db.commit()
        db.refresh(post)
        
        return {
            "isLiked": is_liked,
            "likesCount": post.likes_count or 0
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to like post: {str(e)}")


@router.post("/posts/{post_id}/replies")
async def create_reply(
    post_id: int,
    request: CreateReplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a reply/comment on a post"""
    try:
        post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        content = request.content.strip()
        is_anonymous = request.isAnonymous or False
        
        if not content:
            raise HTTPException(status_code=400, detail="Content is required")
        
        reply = PostReply(
            post_id=post_id,
            author_id=None if is_anonymous else current_user.id,
            content=content,
            is_anonymous=is_anonymous or False
        )
        db.add(reply)
        db.commit()
        db.refresh(reply)
        
        # Get author info if not anonymous
        reply_data: Dict[str, Any] = {
            "id": reply.id,
            "content": reply.content,
            "isAnonymous": reply.is_anonymous,
            "createdAt": reply.created_at.isoformat() if reply.created_at else None,
        }
        
        if not reply.is_anonymous and reply.author_id:
            author = db.query(User).filter(User.id == reply.author_id).first()
            if author:
                reply_data["author"] = {
                    "id": author.id,
                    "firstName": author.first_name,
                    "lastName": author.last_name,
                    "profileImageUrl": author.profile_image_url
                }
        
        return reply_data
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create reply: {str(e)}")


@router.get("/posts/{post_id}/replies")
async def get_replies(
    post_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get replies/comments for a post"""
    try:
        replies = db.query(PostReply)\
            .filter(PostReply.post_id == post_id)\
            .order_by(PostReply.created_at)\
            .limit(limit)\
            .offset(offset)\
            .all()
        
        result = []
        for reply in replies:
            reply_data: Dict[str, Any] = {
                "id": reply.id,
                "content": reply.content,
                "isAnonymous": reply.is_anonymous,
                "createdAt": reply.created_at.isoformat() if reply.created_at else None,
            }
            
            if not reply.is_anonymous and reply.author_id:
                author = db.query(User).filter(User.id == reply.author_id).first()
                if author:
                    reply_data["author"] = {
                        "id": author.id,
                        "firstName": author.first_name,
                        "lastName": author.last_name,
                        "profileImageUrl": author.profile_image_url
                    }
            
            result.append(reply_data)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch replies: {str(e)}")
