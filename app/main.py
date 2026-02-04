"""
Main FastAPI application entry point
"""
import os
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
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
# Allow requests from frontend domain and localhost for development
allowed_origins = [
    "https://collabr18x.com",
    "https://www.collabr18x.com",
    "https://collabr18x.github.io",
    "https://collabr18x.github.io/CollabR18X",
    "https://collabr18x-web.onrender.com",  # Render static site
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
# Add any extra origins from env (comma-separated)
if settings.CORS_ORIGINS:
    allowed_origins.extend(o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip())
# In debug mode, allow all origins
if settings.DEBUG:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Session middleware (using cookies)
from starlette.middleware.sessions import SessionMiddleware
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET,
    max_age=365 * 24 * 60 * 60,  # 365 days (1 year) - users stay logged in until they log out
    same_site="lax"
)


# Redirect Render URL (and other alternate hosts) to canonical domain
_redirect_hosts = [h.strip().lower() for h in settings.REDIRECT_HOSTS.split(",") if h.strip()]
_canonical_url = settings.CANONICAL_URL.rstrip("/")

@app.middleware("http")
async def redirect_to_canonical(request: Request, call_next):
    """Redirect requests from alternate hosts (e.g. collabr18x.onrender.com) to canonical URL."""
    host = (request.headers.get("host") or "").split(":")[0].lower()
    path = request.url.path
    if _canonical_url and host in _redirect_hosts and not path.startswith("/api"):
        # Preserve path and query string
        url = f"{_canonical_url}{path}" + (f"?{request.url.query}" if request.url.query else "")
        return RedirectResponse(url=url, status_code=301)
    return await call_next(request)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    path = request.url.path
    method = request.method
    origin = request.headers.get("origin", "none")
    
    response = await call_next(request)
    
    duration = (datetime.now() - start_time).total_seconds() * 1000
    
    if path.startswith("/api"):
        log(f"{method} {path} {response.status_code} in {duration:.0f}ms (Origin: {origin})")
        # Log errors with more detail
        if response.status_code == 404:
            logger.warning(f"404 Not Found: {method} {path} - Route does not exist")
        elif response.status_code == 405:
            logger.error(f"405 Method Not Allowed: {method} {path} - Route exists but method not allowed")
        elif response.status_code >= 500:
            logger.error(f"{response.status_code} Server Error: {method} {path}")
    
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


# Public health check (no auth) for Render / load balancers
@app.get("/api/health")
async def health():
    return {"status": "ok"}


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
        
        # Serve SPA for all non-API routes (only GET requests, registered last to not interfere with API)
        # This must be registered AFTER all API routes to avoid conflicts
        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str, request: Request):
            """Serve SPA for all non-API GET routes"""
            # Don't interfere with API routes - they should be handled by registered routers
            # This route only handles GET requests, so POST/PUT/DELETE to /api/* won't reach here
            if full_path.startswith("api/"):
                # This shouldn't happen for API routes, but just in case
                return JSONResponse(
                    status_code=404,
                    content={"error": "API route not found", "path": f"/{full_path}"}
                )
            index_path = os.path.join(static_dir, "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path)
            return JSONResponse(
                status_code=404,
                content={"error": "Not found", "path": f"/{full_path}"}
            )


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=settings.DEBUG,
        log_level="info"
    )
