"""
Main FastAPI application entry point
"""
import os
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from datetime import datetime
import logging

from app.database import init_db, Base, engine
from app.routes import register_routes
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(message)s',
    datefmt='%I:%M:%S %p'
)
logger = logging.getLogger(__name__)


def log(message: str, source: str = "fastapi"):
    """Log a message with timestamp"""
    formatted_time = datetime.now().strftime("%I:%M:%S %p")
    logger.info(f"{formatted_time} [{source}] {message}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    log("Initializing database...")
    await init_db()
    # Create tables
    Base.metadata.create_all(bind=engine)
    log("Database initialized")
    
    # Clean up expired sessions on startup
    from app.middleware.auth import cleanup_expired_sessions
    from app.database import SessionLocal
    try:
        db = SessionLocal()
        cleanup_expired_sessions(db)
        db.close()
        log("Expired sessions cleaned up")
    except Exception as e:
        log(f"Warning: Could not clean up expired sessions: {e}")
    
    yield
    # Shutdown
    log("Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="CollabR18X API",
    description="Creator collaboration platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session middleware (using cookies)
from starlette.middleware.sessions import SessionMiddleware
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET,
    max_age=365 * 24 * 60 * 60,  # 365 days (1 year) - users stay logged in until they log out
    same_site="lax"
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    path = request.url.path
    
    response = await call_next(request)
    
    duration = (datetime.now() - start_time).total_seconds() * 1000
    
    if path.startswith("/api"):
        log(f"{request.method} {path} {response.status_code} in {duration:.0f}ms")
        # Log 404 errors with more detail
        if response.status_code == 404:
            logger.warning(f"404 Not Found: {request.method} {path} - Route does not exist")
    
    return response


# Global 404 handler for API routes
from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions with detailed information"""
    path = request.url.path
    method = request.method
    
    # Only handle API routes here (frontend routes are handled by SPA)
    if path.startswith("/api") and exc.status_code == 404:
        logger.error(f"404 Error - Route not found: {method} {path}")
        return JSONResponse(
            status_code=404,
            content={
                "error": "Route not found",
                "message": f"The requested route '{method} {path}' does not exist",
                "path": path,
                "method": method,
                "available_routes": "Check /docs for available API endpoints"
            }
        )
    
    # For other HTTP exceptions, return standard response
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "path": path, "status_code": exc.status_code}
    )


# Register all routes
register_routes(app)


# Serve static files in production
if not settings.DEBUG:
    static_dir = os.path.join(os.path.dirname(__file__), "..", "dist", "public")
    if not os.path.exists(static_dir):
        # Fallback to client/dist for development builds
        static_dir = os.path.join(os.path.dirname(__file__), "..", "client", "dist")
    
    if os.path.exists(static_dir):
        # Serve static assets
        assets_dir = os.path.join(static_dir, "assets")
        if os.path.exists(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        
        # Serve SPA for all non-API routes
        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            """Serve SPA for all non-API routes"""
            if full_path.startswith("api"):
                return {"error": "Not found"}
            index_path = os.path.join(static_dir, "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path)
            return {"error": "Not found"}


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=settings.DEBUG,
        log_level="info"
    )
