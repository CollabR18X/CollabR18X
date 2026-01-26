"""
Authentication service
"""
from sqlalchemy.orm import Session
from app.models.auth import User
from passlib.context import CryptContext
from typing import Optional
from fastapi import Depends, HTTPException, status
from app.database import get_db

# Use Argon2 for password hashing (no 72-byte limit, more secure than bcrypt)
# Support both bcrypt and argon2 during migration period
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")


def create_user(
    db: Session,
    email: str,
    password: str,
    first_name: str,
    last_name: str
) -> User:
    """Create a new user"""
    import uuid
    import logging
    from sqlalchemy.exc import OperationalError, SQLAlchemyError, IntegrityError
    logger = logging.getLogger(__name__)
    
    try:
        user = User(
            id=str(uuid.uuid4()),  # Generate UUID explicitly for SQLite compatibility
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error creating user: {str(e)}")
        if "UNIQUE constraint" in str(e) or "duplicate" in str(e).lower():
            raise ValueError("Email already registered")
        raise ValueError(f"Database constraint error: {str(e)}")
    except (OperationalError, SQLAlchemyError) as e:
        db.rollback()
        logger.error(f"Database error creating user: {str(e)}")
        raise ValueError(f"Database error: {str(e)}")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating user: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise ValueError(f"Failed to create user: {str(e)}")


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate a user"""
    import logging
    from sqlalchemy.exc import OperationalError, SQLAlchemyError
    logger = logging.getLogger(__name__)
    
    try:
        # Try to query the database
        try:
            user = db.query(User).filter(User.email == email).first()
        except (OperationalError, SQLAlchemyError) as db_error:
            logger.error(f"Database connection error during authentication: {str(db_error)}")
            raise  # Re-raise to be handled by caller
        
        if not user:
            logger.warning(f"User not found: {email}")
            return None
        if not user.password:
            logger.warning(f"User {email} has no password set")
            return None
        
        # Verify password (supports both bcrypt and argon2 hashes)
        try:
            if not pwd_context.verify(password, user.password):
                logger.warning(f"Password verification failed for user: {email}")
                return None
        except Exception as e:
            logger.error(f"Password verification error for user {email}: {str(e)}")
            return None
        
        # If password was verified with bcrypt, upgrade to argon2
        # This migrates old passwords to the new algorithm
        try:
            hash_type = pwd_context.identify(user.password)
            if hash_type == "bcrypt":
                # Rehash with argon2 and update in database
                try:
                    new_hash = pwd_context.hash(password)
                    user.password = new_hash
                    db.commit()
                    logger.info(f"Migrated password hash from bcrypt to argon2 for user: {email}")
                except (OperationalError, SQLAlchemyError) as db_error:
                    logger.warning(f"Could not update password hash for user {email}: {str(db_error)}")
                    db.rollback()
        except Exception as e:
            # If identify fails, just continue (password was verified successfully)
            logger.debug(f"Could not identify hash type for user {email}: {str(e)}")
        
        return user
    except (OperationalError, SQLAlchemyError):
        # Re-raise database errors to be handled by caller
        raise
    except Exception as e:
        logger.error(f"Authentication error for user {email}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return None


# get_current_user is now in app.middleware.auth (session-based)
