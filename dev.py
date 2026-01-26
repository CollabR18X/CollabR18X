#!/usr/bin/env python3
"""
Development script to run both backend and frontend servers simultaneously
"""
import subprocess
import sys
import os
import signal
from pathlib import Path
import time

def main():
    """Run both backend and frontend servers"""
    # Get the project root directory
    project_root = Path(__file__).parent
    
    print("=" * 60)
    print("🚀 Starting CollabR18X Development Servers")
    print("=" * 60)
    print()
    
    # Start backend server
    print("📡 Starting backend server (FastAPI) on http://localhost:5000...")
    backend_process = subprocess.Popen(
        [sys.executable, "run.py"],
        cwd=project_root,
        stdout=sys.stdout,
        stderr=sys.stderr,
    )
    
    # Give backend a moment to start
    time.sleep(2)
    
    # Start frontend server
    print("🌐 Starting frontend server (Vite) on http://localhost:5173...")
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=project_root,
        stdout=sys.stdout,
        stderr=sys.stderr,
    )
    
    print()
    print("✅ Both servers are running!")
    print("📡 Backend:  http://localhost:5000")
    print("🌐 Frontend: http://localhost:5173")
    print()
    print("Press Ctrl+C to stop both servers")
    print("=" * 60)
    print()
    
    try:
        # Wait for both processes
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\n" + "=" * 60)
        print("🛑 Stopping servers...")
        print("=" * 60)
        
        # Terminate both processes
        if backend_process.poll() is None:
            backend_process.terminate()
        if frontend_process.poll() is None:
            frontend_process.terminate()
        
        # Wait a bit for graceful shutdown
        try:
            if backend_process.poll() is None:
                backend_process.wait(timeout=5)
            if frontend_process.poll() is None:
                frontend_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            # Force kill if they don't stop
            if backend_process.poll() is None:
                backend_process.kill()
            if frontend_process.poll() is None:
                frontend_process.kill()
        
        print("✅ Servers stopped")
        sys.exit(0)

if __name__ == "__main__":
    main()
