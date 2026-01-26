"""
Authentication middleware and dependencies
"""
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.auth import User, Session as SessionModel
from typing import Optional
import secrets
import json
from datetime import datetime, timedelta


def create_session(db: Session, user_id: str) -> str:
    """Create a new session in the database and return session ID"""
    import logging
    from sqlalchemy.exc import OperationalError, SQLAlchemyError
    logger = logging.getLogger(__name__)
    
    try:
        session_id = secrets.token_urlsafe(32)
        
        # Calculate expiration (1 year from now)
        expire = datetime.utcnow() + timedelta(days=365)
        
        # Store user_id in sess JSON field
        session_data = {
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Create session in database
        db_session = SessionModel(
            sid=session_id,
            sess=json.dumps(session_data),
            expire=expire
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        
        return session_id
    except (OperationalError, SQLAlchemyError) as e:
        db.rollback()
        logger.error(f"Database error creating session: {str(e)}")
        raise ValueError(f"Failed to create session: {str(e)}")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating session: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise ValueError(f"Failed to create session: {str(e)}")


def get_user_from_session(db: Session, session_id: Optional[str]) -> Optional[str]:
    """Get user ID from database session"""
    import logging
    from sqlalchemy.exc import OperationalError, SQLAlchemyError
    logger = logging.getLogger(__name__)
    
    if not session_id:
        return None
    
    try:
        # Get session from database
        db_session = db.query(SessionModel).filter(SessionModel.sid == session_id).first()
        
        if not db_session:
            return None
        
        # Check if session is expired
        if db_session.expire < datetime.utcnow():
            # Delete expired session
            db.delete(db_session)
            db.commit()
            return None
        
        # Parse session data
        try:
            session_data = json.loads(db_session.sess)
            return session_data.get("user_id")
        except (json.JSONDecodeError, KeyError):
            # Invalid session data, delete it
            db.delete(db_session)
            db.commit()
            return None
    except (OperationalError, SQLAlchemyError) as e:
        logger.error(f"Database error getting session: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error getting session: {str(e)}")
        return None


def delete_session(db: Session, session_id: str):
    """Delete a session from the database"""
    db_session = db.query(SessionModel).filter(SessionModel.sid == session_id).first()
    if db_session:
        db.delete(db_session)
        db.commit()


def cleanup_expired_sessions(db: Session):
    """Clean up expired sessions from the database"""
    expired = db.query(SessionModel).filter(SessionModel.expire < datetime.utcnow()).all()
    for session in expired:
        db.delete(session)
    db.commit()


def get_current_user_id(request: Request, db: Session) -> Optional[str]:
    """Get current user ID from session cookie"""
    session_id = request.cookies.get("session_id")
    return get_user_from_session(db, session_id)


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """Dependency to get current authenticated user"""
    user_id = get_current_user_id(request, db)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user


def require_auth(request: Request, db: Session = Depends(get_db)) -> str:
    """Require authentication and return user ID"""
    user_id = get_current_user_id(request, db)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    return user_id
