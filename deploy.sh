#!/usr/bin/env bash
# ==============================================================================
# Senoopsy (TechPulse) — Automated Deployment & Update Script
# ==============================================================================

set -e

# Color helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo -e "${CYAN}==================================================================${NC}"
echo -e "${CYAN}   🚀 Senoopsy Production Deployer & Build Automation Engine     ${NC}"
echo -e "${CYAN}==================================================================${NC}"

# Check backend environment file
if [ ! -f "$ROOT_DIR/backend/.env" ]; then
    echo -e "${YELLOW}⚠️  No backend/.env found. Creating from defaults...${NC}"
    cat <<EOF > "$ROOT_DIR/backend/.env"
MONGODB_URL=mongodb://mongodb:27017
DATABASE_NAME=tech_news_aggregator
RSS_UPDATE_INTERVAL_MINUTES=15
USE_AI_SUMMARY=false
AI_API_KEY=
AI_MODEL=llama-3.3-70b-versatile
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost
EOF
    echo -e "${GREEN}✅ Generated default backend/.env (You can customize this anytime).${NC}"
fi

# ------------------------------------------------------------------------------
# STEP 1: BUILD FRONTEND
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[1/4] Building React Production Bundle...${NC}"
cd "$ROOT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Build static assets (Vite will output to frontend/dist)
npm run build

if [ ! -f "$ROOT_DIR/frontend/dist/index.html" ]; then
    echo -e "${RED}❌ Frontend build failed: index.html not found in dist!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend bundle compiled successfully.${NC}"

# ------------------------------------------------------------------------------
# STEP 2: SYNC STATIC FILES TO NGINX WEB ROOT
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[2/4] Syncing static files to /var/www/senoopsy/dist...${NC}"
TARGET_DIR="/var/www/senoopsy/dist"

if [ -d "/var/www/senoopsy" ]; then
    if [ -w "$TARGET_DIR" ]; then
        rm -rf "${TARGET_DIR:?}"/*
        cp -r "$ROOT_DIR/frontend/dist/"* "$TARGET_DIR/"
    else
        echo -e "${YELLOW}Notice: Need sudo to write to /var/www/senoopsy/dist...${NC}"
        sudo rm -rf "${TARGET_DIR:?}"/*
        sudo cp -r "$ROOT_DIR/frontend/dist/"* "$TARGET_DIR/"
    fi
    echo -e "${GREEN}✅ Static assets synced to web root.${NC}"
else
    echo -e "${YELLOW}⚠️  /var/www/senoopsy directory not yet created. Run setup-ec2.sh first if this is your first time.${NC}"
fi

# ------------------------------------------------------------------------------
# STEP 3: DOCKER COMPOSE PRODUCTION (BACKEND & MONGODB)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[3/4] Launching Backend & MongoDB via Docker Compose...${NC}"
cd "$ROOT_DIR"

# Check if docker compose v2 or docker-compose v1 is used
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}❌ Docker Compose not found. Please install Docker Compose first.${NC}"
    exit 1
fi

$COMPOSE_CMD -f docker-compose.prod.yml up -d --build

# ------------------------------------------------------------------------------
# STEP 4: HEALTH CHECK & NGINX RELOAD
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[4/4] Verifying Backend Health Check...${NC}"
HEALTH_URL="http://127.0.0.1:8000/health"
MAX_RETRIES=15
RETRY_COUNT=0
HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -f "$HEALTH_URL" | grep -q "healthy"; then
        HEALTHY=true
        break
    fi
    echo -e "${YELLOW}Waiting for FastAPI to become ready ($((RETRY_COUNT + 1))/$MAX_RETRIES)...${NC}"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ "$HEALTHY" = true ]; then
    echo -e "${GREEN}✅ Backend is healthy and operational!${NC}"
else
    echo -e "${YELLOW}⚠️  Backend did not report ready in time. View logs with:${NC}"
    echo -e "   $COMPOSE_CMD -f docker-compose.prod.yml logs backend"
fi

if command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Reloading Nginx...${NC}"
    sudo systemctl reload nginx || true
    echo -e "${GREEN}✅ Nginx reloaded.${NC}"
fi

echo -e "\n${CYAN}==================================================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${CYAN}==================================================================${NC}"
echo -e "Useful Commands:"
echo -e "  • View backend logs:       ${YELLOW}$COMPOSE_CMD -f docker-compose.prod.yml logs -f backend${NC}"
echo -e "  • View mongodb logs:       ${YELLOW}$COMPOSE_CMD -f docker-compose.prod.yml logs -f mongodb${NC}"
echo -e "  • Check memory usage:      ${YELLOW}free -m && docker stats --no-stream${NC}"
echo -e "  • Restart backend service: ${YELLOW}$COMPOSE_CMD -f docker-compose.prod.yml restart backend${NC}"
echo -e "${CYAN}==================================================================${NC}\n"
