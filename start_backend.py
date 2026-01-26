#!/usr/bin/env python3
"""Start backend with file logging"""
import sys
import traceback
from datetime import datetime

# Redirect output to a log file
log_file = open("backend_startup.log", "w", encoding="utf-8")

def log(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_message = f"[{timestamp}] {message}\n"
    log_file.write(log_message)
    log_file.flush()
    print(message)  # Also print to console if possible

try:
    log("=" * 60)
    log("Starting CollabR18X Backend")
    log("=" * 60)
    
    log("\n1. Testing imports...")
    from app.main import app
    log("   [OK] App imported successfully")
    
    log("\n2. Testing database...")
    from app.database import engine
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    log("   [OK] Database connection OK")
    
    log("\n3. Getting configuration...")
    from app.config import settings
    log(f"   [OK] Port: {settings.PORT}")
    log(f"   [OK] Debug: {settings.DEBUG}")
    
    log("\n4. Starting uvicorn server...")
    log(f"   Server will run on http://0.0.0.0:{settings.PORT} (accessible from all interfaces)")
    log(f"   Also available at http://localhost:{settings.PORT} and http://127.0.0.1:{settings.PORT}")
    log("   Check backend_startup.log for detailed logs")
    log("=" * 60 + "\n")
    
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=settings.PORT,
        log_level="info"
    )
    
except Exception as e:
    error_msg = f"\n[ERROR] {type(e).__name__}: {e}\n"
    log(error_msg)
    log("Full traceback:")
    log(traceback.format_exc())
    log_file.close()
    sys.exit(1)
finally:
    log_file.close()
