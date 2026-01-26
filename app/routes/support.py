"""
Support routes
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user_id
from app.models.auth import User
from app.models.support import SupportTicket, SupportCategory
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["support"])


class SupportRequest(BaseModel):
    subject: str
    category: str
    message: str
    email: Optional[str] = None


class SupportResponse(BaseModel):
    id: int
    subject: str
    category: str
    status: str
    created_at: str
    message: Optional[str] = None


@router.post("", response_model=SupportResponse)
async def create_support_ticket(
    request: SupportRequest,
    request_obj: Request,
    db: Session = Depends(get_db)
):
    """
    Create a new support ticket
    Supports both authenticated and anonymous requests
    """
    try:
        # Try to get current user (optional)
        current_user = None
        user_id = get_current_user_id(request_obj, db)
        if user_id:
            current_user = db.query(User).filter(User.id == user_id).first()
        
        # Validate category
        try:
            category = SupportCategory(request.category)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid category")
        
        # Get email from user if not provided
        email = request.email or (current_user.email if current_user else None)
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        # Create support ticket
        ticket = SupportTicket(
            user_id=current_user.id if current_user else None,
            subject=request.subject,
            category=category,
            message=request.message,
            email=email,
            status="open"
        )
        
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        
        logger.info(f"Support ticket created: ID={ticket.id}, Category={category.value}, User={current_user.id if current_user else 'anonymous'}")
        
        return SupportResponse(
            id=ticket.id,
            subject=ticket.subject,
            category=ticket.category.value,
            status=ticket.status,
            created_at=ticket.created_at.isoformat() if ticket.created_at else "",
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating support ticket: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create support ticket")
