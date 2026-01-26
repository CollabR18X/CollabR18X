# Quick Start Guide

## Current Status

✅ **Frontend**: React/TypeScript (Node.js required) - Can run with `npm run dev`
❌ **Backend**: Python/FastAPI (Python 3.10+ required) - **NOT INSTALLED**

## To Run the Full Application

### Step 1: Install Python

**Windows:**
1. Download Python 3.12 from https://www.python.org/downloads/
2. **IMPORTANT**: Check "Add Python to PATH" during installation
3. Restart your terminal after installation

**Verify installation:**
```powershell
python --version
# Should show: Python 3.12.x
```

### Step 2: Install Python Dependencies

```powershell
pip install -r requirements.txt
```

### Step 3: Set Up Database

Make sure PostgreSQL is running (Docker container should be running):
```powershell
docker ps
# Should show collabr18x-db-1 container
```

### Step 4: Initialize Database

```powershell
# Option 1: Using Alembic (recommended)
alembic upgrade head

# Option 2: Auto-create tables (development)
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### Step 5: Run the Application

```powershell
python run.py
```

The application will be available at: **http://localhost:5000**

## Running Frontend Only (Without Backend)

If you just want to see the frontend UI (API calls will fail):

```powershell
npm run dev
```

Frontend will be available at: **http://localhost:5173**

## Troubleshooting

### Python Not Found

- Install Python from https://www.python.org/downloads/
- Make sure to check "Add Python to PATH"
- Restart terminal after installation

### Database Connection Error

- Make sure PostgreSQL Docker container is running:
  ```powershell
  docker ps
  ```
- If not running, start it:
  ```powershell
  docker-compose up -d db
  ```

### Port Already in Use

- Change PORT in `.env` file
- Or kill the process using port 5000

## Next Steps After Python Installation

1. Install dependencies: `pip install -r requirements.txt`
2. Initialize database: `alembic upgrade head`
3. Run server: `python run.py`
4. Open browser: http://localhost:5000
