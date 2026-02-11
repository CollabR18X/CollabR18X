"""
Profile picture upload - two-step flow compatible with useUpload hook:
1. POST /api/uploads/request-url - get upload token, returns { uploadURL, objectPath }
2. PUT /api/uploads/complete/{token} - client sends file, we save to disk
"""
import os
import uuid
import time
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional

from app.config import settings
from app.middleware.auth import get_current_user
from app.models.auth import User

router = APIRouter()

# In-memory upload tokens: token -> { user_id, filename, expires }
# Use Redis in production for multi-worker setups
_upload_tokens: dict[str, dict] = {}
_TOKEN_TTL = 300  # 5 minutes
_ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}
_MAX_SIZE = 5 * 1024 * 1024  # 5MB


def _clean_filename(name: str) -> str:
    """Extract safe extension from filename."""
    ext = Path(name).suffix.lower().lstrip(".")
    return ext if ext in _ALLOWED_EXTENSIONS else "jpg"


def _ensure_upload_dir() -> Path:
    """Ensure upload directory exists."""
    profile_dir = Path(settings.UPLOAD_DIR) / "profile"
    profile_dir.mkdir(parents=True, exist_ok=True)
    return profile_dir


class RequestUrlBody(BaseModel):
    name: str
    size: Optional[int] = None
    contentType: Optional[str] = None

    class Config:
        extra = "allow"


@router.post("/uploads/request-url")
async def request_upload_url(
    body: RequestUrlBody,
    current_user: User = Depends(get_current_user),
):
    """
    Request an upload token. Returns uploadURL (PUT endpoint) and objectPath (URL to serve the file).
    Client will PUT the file to uploadURL, then use objectPath as the image URL.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Validate file type (only allow images)
    ext = _clean_filename(body.name)
    if body.size and body.size > _MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 5MB.",
        )

    token = str(uuid.uuid4())
    filename = f"{current_user.id}_{token[:8]}.{ext}"
    _ensure_upload_dir()

    _upload_tokens[token] = {
        "user_id": current_user.id,
        "filename": filename,
        "expires": time.time() + _TOKEN_TTL,
    }

    # uploadURL: client will PUT file here (relative path works for same-origin)
    upload_url = f"/api/uploads/complete/{token}"
    object_path = f"/uploads/profile/{filename}"

    return {
        "uploadURL": upload_url,
        "objectPath": object_path,
        "metadata": {
            "name": body.name,
            "size": body.size,
            "contentType": body.contentType or "image/jpeg",
        },
    }


@router.put("/uploads/complete/{token}")
async def complete_upload(
    token: str,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Receive the file and save to disk. Called by client after request-url.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    if token not in _upload_tokens:
        raise HTTPException(status_code=404, detail="Upload token expired or invalid")

    info = _upload_tokens[token]
    if info["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Token does not belong to you")

    if time.time() > info["expires"]:
        del _upload_tokens[token]
        raise HTTPException(status_code=410, detail="Upload token expired")

    filename = info["filename"]
    profile_dir = _ensure_upload_dir()
    file_path = profile_dir / filename

    try:
        body = await request.body()
        if len(body) > _MAX_SIZE:
            raise HTTPException(status_code=400, detail="File too large")

        file_path.write_bytes(body)
        del _upload_tokens[token]
        return {"objectPath": f"/uploads/profile/{filename}"}
    except HTTPException:
        raise
    except Exception as e:
        if token in _upload_tokens:
            del _upload_tokens[token]
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}",
        )
