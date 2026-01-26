.PHONY: help install build dev start test clean db-migrate db-upgrade db-downgrade

help: ## Show this help message
	@echo "CollabR18X - Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies (frontend and backend)
	@echo "Installing frontend dependencies..."
	npm install
	@echo "Installing Python dependencies..."
	pip install -r requirements.txt
	@echo "✓ All dependencies installed"

build: ## Build frontend and prepare backend for production
	@echo "Building application..."
	python build.py

dev: ## Start development server (frontend + backend)
	@echo "Starting development servers..."
	@echo "Backend will run on http://localhost:5000"
	@echo "Frontend will run on http://localhost:5173"
	python dev.py

start: ## Start production server
	@echo "Starting production server..."
	cd dist && python run.py

test: ## Run tests
	@echo "Running tests..."
	pytest

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	rm -rf dist
	rm -rf node_modules/.vite
	rm -rf .venv
	rm -rf __pycache__
	find . -type d -name __pycache__ -exec rm -r {} +
	find . -type f -name "*.pyc" -delete
	@echo "✓ Clean complete"

db-migrate: ## Create a new database migration
	@echo "Creating new migration..."
	alembic revision --autogenerate -m "$(msg)"

db-upgrade: ## Apply database migrations
	@echo "Applying database migrations..."
	alembic upgrade head

db-downgrade: ## Rollback last database migration
	@echo "Rolling back last migration..."
	alembic downgrade -1

db-init: ## Initialize database (create tables)
	@echo "Initializing database..."
	python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"
