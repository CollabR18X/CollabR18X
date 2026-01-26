"""
Profile service
"""
from sqlalchemy.orm import Session
from app.models.profile import Profile
from app.models.auth import User
from typing import Dict, Optional


def get_profile_by_user_id(db: Session, user_id: str) -> Optional[Profile]:
    """Get profile by user ID"""
    return db.query(Profile).filter(Profile.user_id == user_id).first()


def create_profile(db: Session, user_id: str, profile_data: Dict) -> Profile:
    """Create a new profile"""
    profile = Profile(user_id=user_id, **profile_data)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def update_profile(db: Session, user_id: str, updates: Dict) -> Profile:
    """Update a profile - creates if it doesn't exist
    
    Security: This function only updates the profile for the provided user_id.
    The caller (route handler) must ensure the user_id matches the authenticated user.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        profile = get_profile_by_user_id(db, user_id)
        
        if not profile:
            # Create profile if it doesn't exist
            logger.info(f"Creating new profile for user {user_id}")
            profile = create_profile(db, user_id, updates)
        else:
            # Verify the profile belongs to the user_id (security check)
            if profile.user_id != user_id:
                raise ValueError(f"Profile user_id mismatch: expected {user_id}, got {profile.user_id}")
            
            # Update existing profile - only update fields that are provided
            logger.info(f"Updating profile for user {user_id} with fields: {list(updates.keys())}")
            for key, value in updates.items():
                if hasattr(profile, key):
                    try:
                        # Handle JSON fields that might be passed as dicts
                        if key in ('social_links', 'privacy_settings', 'boundaries', 'interests', 'photos', 'gender_preference', 'tags', 'genders'):
                            # These are JSON fields - ensure they're properly serialized
                            # Convert to JSON-compatible format if needed
                            if isinstance(value, (dict, list)):
                                setattr(profile, key, value)
                            else:
                                setattr(profile, key, value)
                        else:
                            setattr(profile, key, value)
                        logger.debug(f"Set {key} = {str(value)[:100]}")  # Truncate long values for logging
                    except Exception as e:
                        logger.error(f"Error setting {key} to {value}: {str(e)}", exc_info=True)
                        import traceback
                        logger.error(traceback.format_exc())
                        raise ValueError(f"Failed to set field {key}: {str(e)}")
                else:
                    logger.warning(f"Profile model does not have attribute: {key} - skipping")
            
            try:
                db.commit()
                db.refresh(profile)
                logger.info(f"Successfully committed profile update for user {user_id}")
            except Exception as e:
                logger.error(f"Database commit error: {str(e)}", exc_info=True)
                import traceback
                logger.error(traceback.format_exc())
                db.rollback()
                raise
        
        return profile
    except Exception as e:
        db.rollback()
        logger.error(f"Error in update_profile: {str(e)}", exc_info=True)
        raise
