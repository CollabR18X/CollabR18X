"""
Profile picture upload - persists across deploys when S3/R2 is configured.
1. POST /api/uploads/request-url - returns { uploadURL, objectPath }
2. Client PUTs file to uploadURL (our backend when using disk, or S3 presigned when using S3)

When S3_BUCKET + credentials are set: uploads go to S3/R2 (persistent).
Otherwise: uploads go to local disk (lost on Render redeploy).
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

_upload_tokens: dict[str, dict] = {}
_TOKEN_TTL = 300  # 5 minutes
_ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}
_MAX_SIZE = 5 * 1024 * 1024  # 5MB


def _use_s3() -> bool:
    """True if S3-compatible storage is configured."""
    return bool(
        settings.S3_BUCKET
        and settings.AWS_ACCESS_KEY_ID
        and settings.AWS_SECRET_ACCESS_KEY
    )


def _clean_filename(name: str) -> str:
    ext = Path(name).suffix.lower().lstrip(".")
    return ext if ext in _ALLOWED_EXTENSIONS else "jpg"


def _ensure_upload_dir() -> Path:
    profile_dir = Path(settings.UPLOAD_DIR) / "profile"
    profile_dir.mkdir(parents=True, exist_ok=True)
    return profile_dir


def _get_s3_presigned_put_url(key: str, content_type: str) -> str:
    """Generate presigned PUT URL for S3/R2."""
    import boto3
    from botocore.config import Config

    config = Config(
        region_name=settings.AWS_REGION or "auto",
        signature_version="s3v4",
    )
    client = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION or "us-east-1",
        endpoint_url=settings.S3_ENDPOINT_URL or None,
        config=config,
    )
    return client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.S3_BUCKET,
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=_TOKEN_TTL,
    )


def _get_s3_public_url(key: str) -> str:
    """Return public URL for the uploaded object."""
    if settings.S3_PUBLIC_URL:
        base = settings.S3_PUBLIC_URL.rstrip("/")
        return f"{base}/{key}"
    # Cloudflare R2 requires S3_PUBLIC_URL (public bucket URL or custom domain)
    if settings.S3_ENDPOINT_URL and "r2.cloudflarestorage.com" in (settings.S3_ENDPOINT_URL or ""):
        raise ValueError("Set S3_PUBLIC_URL for R2 (R2 dashboard: bucket → Settings → Public access)")
    # AWS S3 with public read
    return f"https://{settings.S3_BUCKET}.s3.{settings.AWS_REGION or 'us-east-1'}.amazonaws.com/{key}"


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
    Returns uploadURL (where to PUT the file) and objectPath (URL to display the image).
    With S3: uploadURL is presigned S3 URL, objectPath is public URL. Persists across deploys.
    Without S3: uploadURL is our backend, objectPath is /uploads/profile/xxx. Lost on redeploy.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    ext = _clean_filename(body.name)
    content_type = body.contentType or "image/jpeg"
    if body.size and body.size > _MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

    token = str(uuid.uuid4())
    filename = f"{current_user.id}_{token[:8]}.{ext}"

    if _use_s3():
        key = f"profile/{filename}"
        try:
            upload_url = _get_s3_presigned_put_url(key, content_type)
            object_path = _get_s3_public_url(key)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate upload URL: {str(e)}",
            )
        return {
            "uploadURL": upload_url,
            "objectPath": object_path,
            "metadata": {
                "name": body.name,
                "size": body.size,
                "contentType": content_type,
            },
        }

    # Disk fallback
    _ensure_upload_dir()
    _upload_tokens[token] = {
        "user_id": current_user.id,
        "filename": filename,
        "expires": time.time() + _TOKEN_TTL,
    }
    upload_url = f"/api/uploads/complete/{token}"
    object_path = f"/uploads/profile/{filename}"
    return {
        "uploadURL": upload_url,
        "objectPath": object_path,
        "metadata": {
            "name": body.name,
            "size": body.size,
            "contentType": content_type,
        },
    }


@router.put("/uploads/complete/{token}")
async def complete_upload(
    token: str,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """Receive file and save to disk. Only used when S3 is not configured."""
    if _use_s3():
        raise HTTPException(
            status_code=400,
            detail="Direct upload not used when S3 is configured",
        )

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
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
