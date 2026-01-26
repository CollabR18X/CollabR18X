# Build and Deployment Guide

This document describes how to build and deploy CollabR18X with the Python backend.

## Prerequisites

- **Python 3.10+** (3.12 recommended)
- **Node.js 18+** and npm
- **PostgreSQL 16+** (or Docker for containerized database)

## Development Setup

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Or use a virtual environment (recommended)
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/collabr18x
SESSION_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
PORT=5000
```

### 3. Initialize Database

```bash
# Option 1: Using Alembic (recommended for production)
alembic upgrade head

# Option 2: Auto-create tables (development only)
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### 4. Run Development Server

```bash
# Start Python backend (serves both API and frontend)
python run.py

# Or use Make
make dev
```

The application will be available at `http://localhost:5000`

## Building for Production

### Using the Build Script

```bash
# Build everything
python build.py

# Or use Make
make build
```

This will:
1. Build the React frontend with Vite
2. Set up Python virtual environment
3. Create production directory structure in `dist/`

### Manual Build

```bash
# 1. Build frontend
npm run build

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Run database migrations
alembic upgrade head
```

## Running in Production

### Direct Python

```bash
cd dist
python run.py
```

### Using Uvicorn

```bash
uvicorn app.main:app --host 0.0.0.0 --port 5000
```

### Using Docker

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.python.yml up --build

# Or build Docker image
docker build -f Dockerfile.python -t collabr18x:latest .
docker run -p 5000:5000 --env-file .env collabr18x:latest
```

## Database Migrations

### Create a Migration

```bash
alembic revision --autogenerate -m "description of changes"
```

### Apply Migrations

```bash
alembic upgrade head
```

### Rollback Migration

```bash
alembic downgrade -1
```

## Available Commands

### Using Make

- `make install` - Install all dependencies
- `make build` - Build for production
- `make dev` - Start development server
- `make start` - Start production server
- `make test` - Run tests
- `make clean` - Clean build artifacts
- `make db-migrate msg="description"` - Create migration
- `make db-upgrade` - Apply migrations
- `make db-downgrade` - Rollback migration
- `make db-init` - Initialize database

### Using npm

- `npm run dev` - Start Vite dev server (frontend only)
- `npm run build` - Build frontend
- `npm run preview` - Preview production build
- `npm run check` - Type check TypeScript

### Using Python

- `python run.py` - Run the application
- `python build.py` - Build for production
- `alembic upgrade head` - Apply database migrations

## Project Structure

```
CollabR18X/
├── app/                    # Python backend
│   ├── main.py            # FastAPI application
│   ├── config.py          # Configuration
│   ├── database.py        # Database connection
│   ├── models/            # SQLAlchemy models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── middleware/        # Middleware (auth, etc.)
├── client/                # React frontend
│   └── src/
├── shared/                # Shared TypeScript types
├── alembic/               # Database migrations
├── dist/                  # Build output
│   ├── public/           # Frontend build
│   └── app/              # Python app (production)
├── build.py              # Build script
├── run.py                # Application entry point
├── requirements.txt      # Python dependencies
├── package.json          # Node.js dependencies
├── Dockerfile.python     # Docker image
└── docker-compose.python.yml  # Docker Compose config
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SESSION_SECRET` | Secret key for sessions | Required |
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `5000` |
| `ISSUER_URL` | Replit OIDC issuer (optional) | - |
| `REPL_ID` | Replit ID (optional) | - |

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists: `psql -U postgres -l`

### Port Already in Use

- Change `PORT` in `.env`
- Or kill the process: `lsof -ti:5000 | xargs kill`

### Frontend Build Fails

- Clear cache: `rm -rf node_modules/.vite`
- Reinstall: `rm -rf node_modules && npm install`

### Python Import Errors

- Ensure virtual environment is activated
- Install dependencies: `pip install -r requirements.txt`
- Check Python path: `python --version` (should be 3.10+)

## Deployment

### Heroku

1. Create `Procfile` (already included)
2. Set environment variables in Heroku dashboard
3. Deploy: `git push heroku main`

### Railway

1. Connect GitHub repository
2. Set environment variables
3. Railway will auto-detect Python and build

### DigitalOcean App Platform

1. Connect repository
2. Set build command: `python build.py`
3. Set run command: `python run.py`
4. Configure environment variables

### Self-Hosted

1. Build: `python build.py`
2. Copy `dist/` to server
3. Install dependencies: `pip install -r requirements.txt`
4. Run: `python run.py`
5. Use process manager (systemd, supervisor, PM2)
