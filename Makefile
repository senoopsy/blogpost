#!/bin/bash

# Start all services with Docker
start:
	docker-compose up -d
	@echo "✅ Services started!"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

# Stop all services
stop:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Restart services
restart:
	docker-compose restart

# Backend only - local dev
backend:
	cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Frontend only - local dev
frontend:
	cd frontend && npm run dev

# Install backend dependencies
install-backend:
	cd backend && python3.11 -m venv venv && source venv/bin/activate && pip install -r requirements.txt

# Install frontend dependencies
install-frontend:
	cd frontend && npm install

# Clean
clean:
	cd backend && rm -rf venv __pycache__
	cd frontend && rm -rf node_modules dist

# Local production build preview
local-prod:
	cd frontend && npm run build
	@echo "Starting local production preview on http://localhost:4173..."
	cd frontend && npx vite preview --port 4173

# Deploy directly to EC2 instance
ec2-deploy:
	./scripts/deploy-to-ec2.sh

# Production deployment
deploy:
	./deploy.sh

# Production logs
prod-logs:
	docker compose -f docker-compose.prod.yml logs -f

# Stop production services
prod-stop:
	docker compose -f docker-compose.prod.yml down

.PHONY: start stop logs restart backend frontend install-backend install-frontend clean deploy prod-logs prod-stop local-prod ec2-deploy