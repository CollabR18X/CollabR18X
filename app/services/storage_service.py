"""
Storage service - mirrors the TypeScript storage.ts functionality
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func, text
from typing import Optional, List, Dict, Any
from app.models import (
    Profile, User, Like, Match, Message, Block, Report,
    Collaboration, CollaborationWorkspace, SavedProfile,
    ForumTopic, ForumPost, PostReply, Event, EventAttendee, SafetyAlert,
    CollabTemplate
)
from datetime import datetime
import math


class StorageService:
    """Storage service for database operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # === Profiles ===
    
    def get_profile(self, profile_id: int) -> Optional[Profile]:
        """Get profile by ID"""
        return self.db.query(Profile).filter(Profile.id == profile_id).first()
    
    def get_profile_by_user_id(self, user_id: str) -> Optional[Profile]:
        """Get profile by user ID"""
        return self.db.query(Profile).filter(Profile.user_id == user_id).first()
    
    def get_all_profiles(self) -> List[Profile]:
        """Get all profiles"""
        return self.db.query(Profile).join(User).all()
    
    def create_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Profile:
        """Create a new profile"""
        profile = Profile(user_id=user_id, **profile_data)
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile
    
    def update_profile(self, user_id: str, updates: Dict[str, Any]) -> Profile:
        """Update a profile"""
        profile = self.get_profile_by_user_id(user_id)
        if not profile:
            profile = self.create_profile(user_id, updates)
        else:
            for key, value in updates.items():
                setattr(profile, key, value)
            self.db.commit()
            self.db.refresh(profile)
        return profile
    
    def update_profile_location(self, user_id: str, lat: float, lng: float) -> Profile:
        """Update profile location"""
        profile = self.get_profile_by_user_id(user_id)
        if profile:
            profile.latitude = lat
            profile.longitude = lng
            profile.location_updated_at = datetime.now()
            self.db.commit()
            self.db.refresh(profile)
        return profile
    
    # === Saved Profiles ===
    
    def save_profile(self, user_id: str, saved_user_id: str) -> SavedProfile:
        """Save a profile"""
        saved = SavedProfile(user_id=user_id, saved_user_id=saved_user_id)
        self.db.add(saved)
        self.db.commit()
        self.db.refresh(saved)
        return saved
    
    def unsave_profile(self, user_id: str, saved_user_id: str) -> bool:
        """Unsave a profile"""
        saved = self.db.query(SavedProfile).filter(
            and_(
                SavedProfile.user_id == user_id,
                SavedProfile.saved_user_id == saved_user_id
            )
        ).first()
        if saved:
            self.db.delete(saved)
            self.db.commit()
            return True
        return False
    
    def get_saved_profiles(self, user_id: str) -> List[SavedProfile]:
        """Get saved profiles for a user"""
        return self.db.query(SavedProfile).filter(
            SavedProfile.user_id == user_id
        ).all()
    
    def is_profile_saved(self, user_id: str, saved_user_id: str) -> bool:
        """Check if profile is saved"""
        saved = self.db.query(SavedProfile).filter(
            and_(
                SavedProfile.user_id == user_id,
                SavedProfile.saved_user_id == saved_user_id
            )
        ).first()
        return saved is not None
    
    # === Likes ===
    
    def create_like(self, liker_id: str, liked_id: str, is_super_like: bool = False) -> Like:
        """Create a like"""
        like = Like(liker_id=liker_id, liked_id=liked_id, is_super_like=is_super_like)
        self.db.add(like)
        self.db.commit()
        self.db.refresh(like)
        return like
    
    def get_likes_received(self, user_id: str) -> List[Like]:
        """Get likes received by a user"""
        return self.db.query(Like).filter(Like.liked_id == user_id).all()
    
    def check_mutual_like(self, user1_id: str, user2_id: str) -> bool:
        """Check if two users have mutually liked each other"""
        like1 = self.db.query(Like).filter(
            and_(Like.liker_id == user1_id, Like.liked_id == user2_id)
        ).first()
        like2 = self.db.query(Like).filter(
            and_(Like.liker_id == user2_id, Like.liked_id == user1_id)
        ).first()
        return like1 is not None and like2 is not None
    
    def has_liked(self, liker_id: str, liked_id: str) -> bool:
        """Check if user has liked another user"""
        like = self.db.query(Like).filter(
            and_(Like.liker_id == liker_id, Like.liked_id == liked_id)
        ).first()
        return like is not None
    
    # === Matches ===
    
    def create_match(self, user1_id: str, user2_id: str) -> Match:
        """Create a match"""
        match = Match(user1_id=user1_id, user2_id=user2_id)
        self.db.add(match)
        self.db.commit()
        self.db.refresh(match)
        return match
    
    def get_matches(self, user_id: str) -> List[Match]:
        """Get all matches for a user"""
        return self.db.query(Match).filter(
            or_(Match.user1_id == user_id, Match.user2_id == user_id)
        ).filter(Match.is_active == True).all()
    
    def get_match(self, match_id: int) -> Optional[Match]:
        """Get a match by ID"""
        return self.db.query(Match).filter(Match.id == match_id).first()
    
    def unmatch(self, match_id: int) -> bool:
        """Unmatch users"""
        match = self.get_match(match_id)
        if match:
            match.is_active = False
            self.db.commit()
            return True
        return False
    
    def is_user_in_match(self, user_id: str, match_id: int) -> bool:
        """Check if user is part of a match"""
        match = self.get_match(match_id)
        if not match:
            return False
        return match.user1_id == user_id or match.user2_id == user_id
    
    # === Messages ===
    
    def send_message(self, match_id: int, sender_id: str, content: str) -> Message:
        """Send a message"""
        message = Message(
            match_id=match_id,
            sender_id=sender_id,
            content=content
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message
    
    def get_messages(self, match_id: int) -> List[Message]:
        """Get messages for a match"""
        return self.db.query(Message).filter(
            Message.match_id == match_id
        ).order_by(Message.created_at.asc()).all()
    
    def mark_messages_as_read(self, match_id: int, user_id: str) -> bool:
        """Mark messages as read"""
        messages = self.db.query(Message).filter(
            and_(
                Message.match_id == match_id,
                Message.sender_id != user_id,
                Message.is_read == False
            )
        ).all()
        for message in messages:
            message.is_read = True
        self.db.commit()
        return True
    
    # === Blocks ===
    
    def create_block(self, blocker_id: str, blocked_id: str) -> Block:
        """Create a block"""
        block = Block(blocker_id=blocker_id, blocked_id=blocked_id)
        self.db.add(block)
        self.db.commit()
        self.db.refresh(block)
        return block
    
    def get_blocks(self, user_id: str) -> List[Block]:
        """Get blocks for a user"""
        return self.db.query(Block).filter(Block.blocker_id == user_id).all()
    
    def remove_block(self, block_id: int) -> bool:
        """Remove a block"""
        block = self.db.query(Block).filter(Block.id == block_id).first()
        if block:
            self.db.delete(block)
            self.db.commit()
            return True
        return False
    
    def is_blocked(self, user1_id: str, user2_id: str) -> bool:
        """Check if user1 has blocked user2"""
        block = self.db.query(Block).filter(
            and_(Block.blocker_id == user1_id, Block.blocked_id == user2_id)
        ).first()
        return block is not None
    
    # === Reports ===
    
    def create_report(self, reporter_id: str, reported_id: str, reason: str, description: Optional[str] = None) -> Report:
        """Create a report"""
        report = Report(
            reporter_id=reporter_id,
            reported_id=reported_id,
            reason=reason,
            description=description
        )
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report
    
    # === Collaborations ===
    
    def get_collaborations_for_user(self, user_id: str) -> List[Collaboration]:
        """Get collaborations for a user"""
        return self.db.query(Collaboration).filter(
            or_(
                Collaboration.requester_id == user_id,
                Collaboration.receiver_id == user_id
            )
        ).all()
    
    def create_collaboration(self, requester_id: str, receiver_id: str, message: str) -> Collaboration:
        """Create a collaboration request"""
        collab = Collaboration(
            requester_id=requester_id,
            receiver_id=receiver_id,
            message=message
        )
        self.db.add(collab)
        self.db.commit()
        self.db.refresh(collab)
        return collab
    
    def update_collaboration_status(self, collab_id: int, status: str) -> Optional[Collaboration]:
        """Update collaboration status"""
        collab = self.db.query(Collaboration).filter(Collaboration.id == collab_id).first()
        if collab:
            collab.status = status
            self.db.commit()
            self.db.refresh(collab)
        return collab
    
    def acknowledge_collaboration(self, collab_id: int, user_id: str) -> Optional[Collaboration]:
        """Acknowledge a collaboration"""
        collab = self.db.query(Collaboration).filter(Collaboration.id == collab_id).first()
        if collab:
            if collab.requester_id == user_id:
                collab.acknowledged_by_requester = True
            elif collab.receiver_id == user_id:
                collab.acknowledged_by_receiver = True
            self.db.commit()
            self.db.refresh(collab)
        return collab


def get_storage(db: Session) -> StorageService:
    """Get storage service instance"""
    return StorageService(db)
