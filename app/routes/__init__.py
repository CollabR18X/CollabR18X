"""
API routes
"""
from fastapi import FastAPI
from app.routes import auth, profiles, matching, collaboration, community, moderation, support, connections, vault, statistics

def register_routes(app: FastAPI):
    """Register all API routes"""
    app.include_router(auth.router, prefix="/api", tags=["auth"])
    app.include_router(profiles.router, prefix="/api", tags=["profiles"])
    app.include_router(matching.router, prefix="/api", tags=["matching"])
    app.include_router(collaboration.router, prefix="/api", tags=["collaboration"])
    app.include_router(community.router, prefix="/api", tags=["community"])
    app.include_router(moderation.router, prefix="/api", tags=["moderation"])
    app.include_router(support.router, prefix="/api/support", tags=["support"])
    app.include_router(connections.router, prefix="/api", tags=["connections"])
    app.include_router(vault.router, prefix="/api", tags=["vault"])
    app.include_router(statistics.router, prefix="/api", tags=["statistics"])
