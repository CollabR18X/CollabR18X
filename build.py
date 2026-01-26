#!/usr/bin/env python3
"""
Build script for CollabR18X
Builds the frontend and prepares the Python backend for production
"""
import os
import sys
import subprocess
import shutil
from pathlib import Path


def run_command(cmd: list[str], cwd: Path | None = None) -> bool:
    """Run a command and return True if successful"""
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=cwd)
    if result.returncode != 0:
        print(f"Error: Command failed with exit code {result.returncode}")
        return False
    return True


def build_frontend() -> bool:
    """Build the React frontend using Vite"""
    print("\n=== Building Frontend ===")
    
    # Check if node_modules exists
    if not Path("node_modules").exists():
        print("Installing frontend dependencies...")
        if not run_command(["npm", "install"]):
            return False
    
    # Build frontend
    print("Building frontend with Vite...")
    if not run_command(["npm", "run", "build"]):
        return False
    
    # Verify build output
    dist_dir = Path("dist/public")
    if not dist_dir.exists():
        print("Error: Frontend build output not found")
        return False
    
    print(f"✓ Frontend built successfully to {dist_dir}")
    return True


def setup_python_env() -> bool:
    """Set up Python environment and install dependencies"""
    print("\n=== Setting up Python Environment ===")
    
    # Check if virtual environment exists
    venv_path = Path(".venv")
    if not venv_path.exists():
        print("Creating Python virtual environment...")
        if not run_command([sys.executable, "-m", "venv", ".venv"]):
            return False
    
    # Determine pip path
    if os.name == "nt":  # Windows
        pip_path = venv_path / "Scripts" / "pip.exe"
        python_path = venv_path / "Scripts" / "python.exe"
    else:  # Unix-like
        pip_path = venv_path / "bin" / "pip"
        python_path = venv_path / "bin" / "python"
    
    # Install Python dependencies
    print("Installing Python dependencies...")
    if not run_command([str(pip_path), "install", "-r", "requirements.txt"]):
        return False
    
    print("✓ Python environment set up successfully")
    return True


def create_production_structure() -> bool:
    """Create production directory structure"""
    print("\n=== Creating Production Structure ===")
    
    # Create dist directory if it doesn't exist
    dist_dir = Path("dist")
    dist_dir.mkdir(exist_ok=True)
    
    # Copy Python app to dist
    app_dist = dist_dir / "app"
    if app_dist.exists():
        shutil.rmtree(app_dist)
    shutil.copytree("app", app_dist, ignore=shutil.ignore_patterns("__pycache__", "*.pyc", ".pytest_cache"))
    
    # Copy run.py
    shutil.copy("run.py", dist_dir / "run.py")
    
    # Copy requirements.txt
    shutil.copy("requirements.txt", dist_dir / "requirements.txt")
    
    # Copy .env.example if it exists
    if Path(".env.example").exists():
        shutil.copy(".env.example", dist_dir / ".env.example")
    
    print("✓ Production structure created")
    return True


def main():
    """Main build function"""
    print("=" * 60)
    print("CollabR18X Build Script")
    print("=" * 60)
    
    # Change to project root
    os.chdir(Path(__file__).parent)
    
    # Build steps
    steps = [
        ("Frontend", build_frontend),
        ("Python Environment", setup_python_env),
        ("Production Structure", create_production_structure),
    ]
    
    for step_name, step_func in steps:
        if not step_func():
            print(f"\n❌ Build failed at step: {step_name}")
            sys.exit(1)
    
    print("\n" + "=" * 60)
    print("✓ Build completed successfully!")
    print("=" * 60)
    print("\nTo run the application:")
    print("  python run.py")
    print("\nOr in production:")
    print("  cd dist")
    print("  python run.py")


if __name__ == "__main__":
    main()
