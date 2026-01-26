"""
Profile routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.profile import Profile
from app.models.auth import User
from app.services.profile_service import get_profile_by_user_id, update_profile, create_profile
from app.services.storage_service import get_storage
from app.middleware.auth import get_current_user, require_auth
from app.models.auth import User
from pydantic import BaseModel
from typing import Optional, Dict, List
from fastapi import Request

router = APIRouter()


def convert_profile_to_camel_case(profile_dict: dict) -> dict:
    """Convert profile dictionary from snake_case to camelCase for frontend"""
    field_mapping = {
        "portfolio_url": "portfolioUrl",
        "social_links": "socialLinks",
        "is_nsfw": "isNsfw",
        "is_visible": "isVisible",
        "privacy_settings": "privacySettings",
        "looking_for": "lookingFor",
        "birth_date": "birthDate",
        "relationship_type": "relationshipType",
        "min_age_preference": "minAgePreference",
        "max_age_preference": "maxAgePreference",
        "max_distance": "maxDistance",
        "gender_preference": "genderPreference",
        "location_updated_at": "locationUpdatedAt",
        "consent_acknowledged_at": "consentAcknowledgedAt",
        "experience_level": "experienceLevel",
        "travel_mode": "travelMode",
        "monetization_expectation": "monetizationExpectation",
        "user_id": "userId",
        "age_verified": "ageVerified",
        "socials_verified": "socialsVerified",
        "last_active": "lastActive",
    }
    
    result = {}
    for key, value in profile_dict.items():
        # Skip internal SQLAlchemy attributes
        if key.startswith("_"):
            continue
        # Use camelCase if mapping exists, otherwise keep original
        camel_key = field_mapping.get(key, key)
        result[camel_key] = value
    return result


class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    niche: Optional[str] = None
    portfolio_url: Optional[str] = None
    portfolioUrl: Optional[str] = None  # Accept camelCase from frontend
    location: Optional[str] = None
    social_links: Optional[Dict] = None
    socialLinks: Optional[Dict] = None  # Accept camelCase from frontend
    is_nsfw: Optional[bool] = None
    isNsfw: Optional[bool] = None  # Accept camelCase from frontend
    interests: Optional[List[str]] = None
    gender: Optional[str] = None
    looking_for: Optional[str] = None
    lookingFor: Optional[str] = None  # Accept camelCase from frontend
    is_visible: Optional[bool] = None
    isVisible: Optional[bool] = None  # Accept camelCase from frontend
    privacy_settings: Optional[Dict] = None
    privacySettings: Optional[Dict] = None  # Accept camelCase from frontend
    photos: Optional[List[str]] = None
    boundaries: Optional[Dict] = None
    displayName: Optional[str] = None  # User display name
    display_name: Optional[str] = None  # Also accept snake_case
    # Additional profile fields
    occupation: Optional[str] = None
    education: Optional[str] = None
    height: Optional[int] = None
    birth_date: Optional[str] = None
    birthDate: Optional[str] = None
    relationship_type: Optional[str] = None
    relationshipType: Optional[str] = None
    experience_level: Optional[str] = None
    experienceLevel: Optional[str] = None
    availability: Optional[str] = None
    travel_mode: Optional[str] = None
    travelMode: Optional[str] = None
    monetization_expectation: Optional[str] = None
    monetizationExpectation: Optional[str] = None
    # Add other fields as needed
    
    class Config:
        extra = "allow"  # Allow extra fields


@router.get("/profiles/me")
async def get_my_profile(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's profile"""
    profile = get_profile_by_user_id(db, current_user.id)
    
    # Return 404 if profile doesn't exist (frontend will handle this)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    user = db.query(User).filter(User.id == profile.user_id).first()
    
    # Ensure all fields are included, even if null/empty
    # Get all columns from the Profile model to ensure nothing is missing
    profile_dict = {}
    for column in Profile.__table__.columns:
        key = column.name
        value = getattr(profile, key, None)
        profile_dict[key] = value
    
    # Also include any additional attributes that might exist
    for key, value in profile.__dict__.items():
        if not key.startswith("_") and key not in profile_dict:
            profile_dict[key] = value
    
    # Convert to camelCase for frontend
    profile_camel = convert_profile_to_camel_case(profile_dict)
    
    return {
        **profile_camel,
        "user": {
            "id": user.id if user else None,
            "email": user.email if user else None,
            "firstName": user.first_name if user else None,
            "lastName": user.last_name if user else None,
            "displayName": user.display_name if user else None,
            "profileImageUrl": user.profile_image_url if user else None,
        } if user else None
    }


@router.put("/profiles/me")
async def update_my_profile(
    updates: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile - requires authentication"""
    # Authentication is enforced by get_current_user dependency
    # If current_user is None, get_current_user will raise 401 Unauthorized
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required to update profile"
        )
    
    try:
        import logging
        logger = logging.getLogger(__name__)
        
        # Convert camelCase to snake_case for database fields
        update_dict = updates.dict(exclude_unset=True)
        logger.info(f"Received update request with keys: {list(update_dict.keys())}")
        
        db_updates = {}
        
        # Handle display name separately (it's a User field, not Profile field)
        display_name = update_dict.get("displayName") or update_dict.get("display_name")
        # Remove from update_dict so it's not processed as a profile field
        update_dict.pop("displayName", None)
        update_dict.pop("display_name", None)
        
        # Map frontend field names (camelCase) to database field names (snake_case)
        field_mapping = {
            "portfolioUrl": "portfolio_url",
            "portfolio_url": "portfolio_url",  # Also accept snake_case
            "socialLinks": "social_links",
            "social_links": "social_links",  # Also accept snake_case
            "isNsfw": "is_nsfw",
            "is_nsfw": "is_nsfw",  # Also accept snake_case
            "isVisible": "is_visible",
            "is_visible": "is_visible",  # Also accept snake_case
            "privacySettings": "privacy_settings",
            "privacy_settings": "privacy_settings",  # Also accept snake_case
            "lookingFor": "looking_for",
            "looking_for": "looking_for",  # Also accept snake_case
            "birthDate": "birth_date",
            "birth_date": "birth_date",
            "relationshipType": "relationship_type",
            "relationship_type": "relationship_type",
            "minAgePreference": "min_age_preference",
            "min_age_preference": "min_age_preference",
            "maxAgePreference": "max_age_preference",
            "max_age_preference": "max_age_preference",
            "maxDistance": "max_distance",
            "max_distance": "max_distance",
            "genderPreference": "gender_preference",
            "gender_preference": "gender_preference",
            "locationUpdatedAt": "location_updated_at",
            "location_updated_at": "location_updated_at",
            "consentAcknowledgedAt": "consent_acknowledged_at",
            "consent_acknowledged_at": "consent_acknowledged_at",
            "experienceLevel": "experience_level",
            "experience_level": "experience_level",
            "travelMode": "travel_mode",
            "travel_mode": "travel_mode",
            "monetizationExpectation": "monetization_expectation",
            "monetization_expectation": "monetization_expectation",
        }
        
        # Fields to skip (handled separately)
        skip_fields = {"displayName", "display_name", "boundaries", "interests", "photos", "privacySettings", "privacy_settings", "socialLinks", "social_links"}
        
        for key, value in update_dict.items():
            # Skip fields that are handled separately
            if key in skip_fields:
                continue
            # Use mapped key if it exists, otherwise use original key
            db_key = field_mapping.get(key, key)
            # Only add non-None values
            if value is not None:
                db_updates[db_key] = value
        
        # Handle special JSON fields separately (allow empty arrays/objects to be saved)
        if "boundaries" in update_dict:
            db_updates["boundaries"] = update_dict["boundaries"] if update_dict["boundaries"] is not None else {}
        if "interests" in update_dict:
            db_updates["interests"] = update_dict["interests"] if update_dict["interests"] is not None else []
        if "photos" in update_dict:
            db_updates["photos"] = update_dict["photos"] if update_dict["photos"] is not None else []
        if "privacySettings" in update_dict:
            db_updates["privacy_settings"] = update_dict["privacySettings"] if update_dict["privacySettings"] is not None else {}
        elif "privacy_settings" in update_dict:
            db_updates["privacy_settings"] = update_dict["privacy_settings"] if update_dict["privacy_settings"] is not None else {}
        if "socialLinks" in update_dict:
            db_updates["social_links"] = update_dict["socialLinks"] if update_dict["socialLinks"] is not None else {}
        elif "social_links" in update_dict:
            db_updates["social_links"] = update_dict["social_links"] if update_dict["social_links"] is not None else {}
        
        logger.info(f"Prepared db_updates with keys: {list(db_updates.keys())}")
        
        # If no updates to make, return current profile
        if not db_updates and display_name is None:
            logger.info("No updates to apply")
            profile = get_profile_by_user_id(db, current_user.id)
            if not profile:
                raise HTTPException(status_code=404, detail="Profile not found")
            user = db.query(User).filter(User.id == current_user.id).first()
            profile_dict = {}
            for column in Profile.__table__.columns:
                key = column.name
                value = getattr(profile, key, None)
                profile_dict[key] = value
            for key, value in profile.__dict__.items():
                if not key.startswith("_") and key not in profile_dict:
                    profile_dict[key] = value
            profile_camel = convert_profile_to_camel_case(profile_dict)
            return {
                **profile_camel,
                "user": {
                    "id": user.id if user else None,
                    "email": user.email if user else None,
                    "firstName": user.first_name if user else None,
                    "lastName": user.last_name if user else None,
                    "displayName": user.display_name if user else None,
                    "profileImageUrl": user.profile_image_url if user else None,
                } if user else None
            }
        
        # Update display name if provided (User field, not Profile field)
        # Set it before updating profile so we can commit both together
        if display_name is not None:
            try:
                # Check if display_name column exists (for backward compatibility)
                if hasattr(current_user, 'display_name'):
                    current_user.display_name = display_name
                    logger.info(f"Set display_name for user {current_user.id}")
                else:
                    logger.warning("display_name column does not exist in User model - skipping update")
            except Exception as e:
                logger.error(f"Error setting display_name: {str(e)}", exc_info=True)
                # Don't fail the entire update if display_name fails - just log it
                logger.warning(f"Continuing with profile update despite display_name error")
        
        # Explicitly ensure we're updating the current user's profile only
        # The update_profile service will use current_user.id, ensuring users can only update their own profile
        try:
            # Update profile first (this will commit the transaction)
            profile = update_profile(db, current_user.id, db_updates)
            
            # If display_name was set, commit it in a separate transaction
            # (update_profile already committed, so we're in a new transaction)
            if display_name is not None and hasattr(current_user, 'display_name'):
                try:
                    # The display_name was already set above, just need to commit it
                    # Since update_profile committed, we're in a new transaction
                    db.commit()
                    db.refresh(current_user)
                    logger.info(f"Committed display_name update for user {current_user.id}")
                except Exception as e:
                    logger.warning(f"Could not commit display_name: {str(e)} - profile update succeeded")
                    # Don't fail - profile was already saved
                    try:
                        db.rollback()
                    except:
                        pass
            
            logger.info(f"Successfully updated profile for user {current_user.id}")
        except Exception as e:
            logger.error(f"Error in update_profile: {str(e)}", exc_info=True)
            import traceback
            logger.error(traceback.format_exc())
            try:
                db.rollback()
            except:
                pass
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update profile in database: {str(e)}"
            )
        
        # Double-check: verify the profile belongs to the current user (security validation)
        if profile.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only update your own profile"
            )
        
        user = db.query(User).filter(User.id == profile.user_id).first()
        
        # Convert profile to camelCase for frontend
        # Get all columns from the Profile model to ensure nothing is missing
        profile_dict = {}
        for column in Profile.__table__.columns:
            key = column.name
            value = getattr(profile, key, None)
            profile_dict[key] = value
        
        # Also include any additional attributes that might exist
        for key, value in profile.__dict__.items():
            if not key.startswith("_") and key not in profile_dict:
                profile_dict[key] = value
        
        profile_camel = convert_profile_to_camel_case(profile_dict)
        
        return {
            **profile_camel,
            "user": {
                "id": user.id if user else None,
                "email": user.email if user else None,
                "firstName": user.first_name if user else None,
                "lastName": user.last_name if user else None,
                "displayName": user.display_name if user else None,
                "profileImageUrl": user.profile_image_url if user else None,
            } if user else None
        }
    except Exception as e:
        import logging
        logging.error(f"Error updating profile: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update profile: {str(e)}"
        )


@router.get("/profiles/{profile_id}")
async def get_profile(
    profile_id: int,
    db: Session = Depends(get_db)
):
    """Get a profile by ID"""
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Convert profile to camelCase for frontend
    # Get all columns from the Profile model to ensure nothing is missing
    profile_dict = {}
    for column in Profile.__table__.columns:
        key = column.name
        value = getattr(profile, key, None)
        profile_dict[key] = value
    
    # Also include any additional attributes that might exist
    for key, value in profile.__dict__.items():
        if not key.startswith("_") and key not in profile_dict:
            profile_dict[key] = value
    
    profile_camel = convert_profile_to_camel_case(profile_dict)
    
    return {
        **profile_camel,
        "user": {
            "id": profile.user.id,
            "email": profile.user.email,
            "firstName": profile.user.first_name,
            "lastName": profile.user.last_name,
            "displayName": profile.user.display_name,
            "profileImageUrl": profile.user.profile_image_url,
        }
    }
