# CollabR18X - Python Backend

This is the Python version of the CollabR18X backend, migrated from TypeScript/Node.js.

## Quick Start

### Development

```bash
# Install dependencies
npm install  # Frontend
pip install -r requirements.txt  # Backend

# Set up environment
cp .env.example .env  # Edit with your settings

# Initialize database
alembic upgrade head

# Run the application
python run.py
```

### Production Build

```bash
# Build everything
python build.py

# Or use Make
make build
```

## Setup

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

2. **Create a `.env` file:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/collabr18x
SESSION_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
PORT=5000
```

3. **Initialize database:**
```bash
# Using Alembic (recommended)
alembic upgrade head

# Or auto-create tables (development only)
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

4. **Run the server:**
```bash
python run.py
```

Or using uvicorn directly:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 5000
```

## Project Structure

- `app/` - Main application code
  - `main.py` - FastAPI application entry point
  - `config.py` - Configuration settings
  - `database.py` - Database connection and session management
  - `models/` - SQLAlchemy database models
  - `routes/` - API route handlers
  - `services/` - Business logic services
  - `middleware/` - Authentication middleware

- `client/` - React frontend (TypeScript)
- `shared/` - Shared TypeScript types
- `alembic/` - Database migrations
- `dist/` - Build output

## Features Implemented

✅ **Session-Based Authentication**
- Cookie-based session management
- Automatic login on registration
- Secure password hashing with bcrypt
- Session middleware with 7-day expiration

✅ **API Routes**
- Authentication: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/user`
- Profiles: `/api/profiles/me`, `/api/profiles/update`, `/api/profiles/{id}`, `/api/profiles/discover`, `/api/profiles/saved`
- Matching: `/api/likes`, `/api/matches`, `/api/matches/{id}/messages`
- Collaborations: `/api/collaborations`
- Moderation: `/api/blocks`, `/api/reports`

✅ **Database Models**
- All models converted from Drizzle ORM to SQLAlchemy
- Relationships properly configured
- Supports existing PostgreSQL schema

✅ **Storage Service**
- Complete storage service with all CRUD operations
- Rate limiting for messages (30 per minute)
- Block checking and validation

✅ **Build System**
- Python build script (`build.py`)
- Makefile for common tasks
- Docker support
- Alembic for database migrations

## Migration Status

✅ Core structure created
✅ Database models converted to SQLAlchemy
✅ All routes converted to FastAPI
✅ Session-based authentication implemented
✅ Storage service layer completed
✅ Frontend integration complete
✅ Build scripts and configuration files converted

## Authentication

The backend uses cookie-based session authentication:
- Sessions are stored in-memory (for production, use Redis or database sessions)
- Session cookies are HTTP-only and secure
- 7-day session expiration
- Automatic login on registration

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
- `make clean` - Clean build artifacts
- `make db-migrate msg="description"` - Create migration
- `make db-upgrade` - Apply migrations
- `make db-downgrade` - Rollback migration

### Using npm

- `npm run dev` - Start Vite dev server (frontend only)
- `npm run build` - Build frontend
- `npm run preview` - Preview production build

### Using Python

- `python run.py` - Run the application
- `python build.py` - Build for production

## Notes

- The frontend (React/TypeScript) remains unchanged and connects to the Python backend via API
- Database schema is preserved - existing PostgreSQL database can be used
- All API endpoints match the original Express routes
- Session management is currently in-memory (should be moved to Redis/database for production)

## Development

The server runs on port 5000 by default. The React frontend should connect to `http://localhost:5000/api` for all API calls.

In development, Vite dev server can proxy API requests to the Python backend.

## Production Considerations

1. **Session Storage**: Replace in-memory sessions with Redis or database-backed sessions
2. **HTTPS**: Enable secure cookies in production
3. **CORS**: Restrict CORS origins to your frontend domain
4. **Rate Limiting**: Consider using a proper rate limiting library (e.g., slowapi)
5. **Database Connection Pooling**: Configure proper connection pooling for production
6. **Static Files**: Ensure frontend build is in `dist/public` directory
7. **Environment Variables**: Use secure secret management in production

## Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.python.yml up --build

# Or build Docker image
docker build -f Dockerfile.python -t collabr18x:latest .
docker run -p 5000:5000 --env-file .env collabr18x:latest
```

## See Also

- `README_BUILD.md` - Detailed build and deployment guide
- `requirements.txt` - Python dependencies
- `package.json` - Node.js dependencies (for frontend)
