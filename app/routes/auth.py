"""
Authentication routes
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.auth import User
from app.services.auth_service import create_user, authenticate_user
from app.middleware.auth import get_current_user, create_session, delete_session
from pydantic import BaseModel, EmailStr
from typing import Optional
from passlib.context import CryptContext

router = APIRouter()
security = HTTPBearer()
# Use Argon2 for password hashing (no 72-byte limit, more secure than bcrypt)
# Support both bcrypt and argon2 during migration period
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/auth/register")
async def register(
    request: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # Check if user exists
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Validate password (check bytes, not characters)
        password_bytes = len(request.password.encode('utf-8'))
        if password_bytes < 8 or password_bytes > 100:
            raise HTTPException(status_code=400, detail="Password must be between 8 and 100 bytes")
        
        # Hash password with Argon2 (no 72-byte limit, more secure than bcrypt)
        hashed_password = pwd_context.hash(request.password)
        
        # Create user
        try:
            user = create_user(
                db=db,
                email=request.email,
                password=hashed_password,
                first_name=request.first_name,
                last_name=request.last_name
            )
        except ValueError as ve:
            # Handle validation errors from create_user
            raise HTTPException(status_code=400, detail=str(ve))
        
        # Create session and log in automatically (database-backed)
        try:
            session_id = create_session(db, user.id)
        except ValueError as ve:
            # If session creation fails, user is still created, but we can't log them in
            logger.warning(f"Session creation failed for user {user.id}: {str(ve)}")
            # Still return success, but user will need to log in manually
            return {
                "message": "User created successfully, but automatic login failed. Please log in.",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "firstName": user.first_name,
                    "lastName": user.last_name,
                    "profileImageUrl": user.profile_image_url,
                }
            }
        
        # Set session cookie with long expiration (users stay logged in until they log out)
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax",
            max_age=365 * 24 * 60 * 60  # 365 days (1 year) - persistent login
        )
        
        return {
            "message": "User created successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "profileImageUrl": user.profile_image_url,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        error_msg = str(e)
        logger.error(f"Registration error: {error_msg}")
        logger.error(traceback.format_exc())
        # Return a more user-friendly error message
        if "UNIQUE constraint" in error_msg or "duplicate" in error_msg.lower():
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=500, detail=f"Registration failed: {error_msg}")


@router.post("/auth/login")
async def login(
    request: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """Login user"""
    import logging
    from sqlalchemy.exc import OperationalError, SQLAlchemyError
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Login attempt for email: {request.email}")
        
        # Try to authenticate user
        try:
            user = authenticate_user(db, request.email, request.password)
        except (OperationalError, SQLAlchemyError) as db_error:
            logger.error(f"Database error during login: {str(db_error)}")
            raise HTTPException(
                status_code=503,
                detail="Database connection failed. Please check if the database is running."
            )
        except Exception as auth_error:
            logger.error(f"Authentication error: {str(auth_error)}")
            import traceback
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"Authentication error: {str(auth_error)}"
            )
        
        if not user:
            logger.warning(f"Authentication failed for email: {request.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Ensure user.id is a string
        user_id = str(user.id)
        
        # Create session (database-backed for persistence across restarts)
        try:
            session_id = create_session(db, user_id)
            logger.info(f"Session created for user: {user_id}")
        except ValueError as ve:
            # If session creation fails, log it but don't fail the login
            logger.error(f"Session creation failed for user {user_id}: {str(ve)}")
            # Return error - user can't be logged in without a session
            raise HTTPException(
                status_code=500,
                detail="Failed to create login session. Please try again."
            )
        
        # Set session cookie with long expiration (users stay logged in until they log out)
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax",
            max_age=365 * 24 * 60 * 60  # 365 days (1 year) - persistent login
        )
        
        logger.info(f"Login successful for user: {user.email}")
        return {
            "message": "Login successful",
            "user": {
                "id": user.id,
                "email": user.email,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "profileImageUrl": user.profile_image_url,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = str(e)
        logger.error(f"Login error: {error_msg}")
        logger.error(traceback.format_exc())
        # Return more specific error messages
        if "Database" in error_msg or "database" in error_msg.lower():
            raise HTTPException(status_code=503, detail="Database connection failed. Please check if the database is running.")
        if "session" in error_msg.lower():
            raise HTTPException(status_code=500, detail="Failed to create login session. Please try again.")
        raise HTTPException(status_code=500, detail=f"Login failed: {error_msg}")


@router.get("/auth/user")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "firstName": current_user.first_name,
        "lastName": current_user.last_name,
        "displayName": current_user.display_name,
        "profileImageUrl": current_user.profile_image_url,
    }


@router.get("/auth/logout")
async def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Logout user"""
    session_id = request.cookies.get("session_id")
    if session_id:
        delete_session(db, session_id)
    
    # Clear session cookie
    response.delete_cookie(key="session_id")
    
    return {"message": "Logged out successfully"}


@router.put("/auth/password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # Verify current password
        if not current_user.password:
            raise HTTPException(status_code=400, detail="No password set for this account")
        
        if not pwd_context.verify(request.current_password, current_user.password):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # Validate new password
        password_bytes = len(request.new_password.encode('utf-8'))
        if password_bytes < 8 or password_bytes > 100:
            raise HTTPException(status_code=400, detail="New password must be between 8 and 100 bytes")
        
        # Check if new password is different from current
        if pwd_context.verify(request.new_password, current_user.password):
            raise HTTPException(status_code=400, detail="New password must be different from current password")
        
        # Hash new password
        hashed_password = pwd_context.hash(request.new_password)
        
        # Update password
        current_user.password = hashed_password
        db.commit()
        db.refresh(current_user)
        
        logger.info(f"Password changed for user: {current_user.email}")
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to change password")
