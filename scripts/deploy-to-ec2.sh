#!/usr/bin/env bash
# ==============================================================================
# Senoopsy (TechPulse) — Automated AWS EC2 Deployment Script
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

EC2_HOST="${1:-3.109.3.45}"
EC2_USER="${2:-ubuntu}"
KEY_PATH="${3:-/Users/rahul/Downloads/devops-journey.pem}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${CYAN}==================================================================${NC}"
echo -e "${CYAN}   🚀 Senoopsy AWS EC2 Automated Deployment Pipeline             ${NC}"
echo -e "${CYAN}   Target: ${EC2_USER}@${EC2_HOST}                               ${NC}"
echo -e "${CYAN}==================================================================${NC}"

# Check private key
if [ ! -f "$KEY_PATH" ]; then
    echo -e "${RED}❌ SSH key not found at: ${KEY_PATH}${NC}"
    exit 1
fi
chmod 400 "$KEY_PATH"

# Test SSH connection
echo -e "\n${BLUE}[1/5] Verifying SSH connectivity to ${EC2_HOST}...${NC}"
ssh -i "$KEY_PATH" -o ConnectTimeout=8 -o BatchMode=yes -o StrictHostKeyChecking=accept-new "${EC2_USER}@${EC2_HOST}" "echo 'SSH connection verified!'" || {
    echo -e "${RED}❌ Unable to connect via SSH to ${EC2_USER}@${EC2_HOST}${NC}"
    exit 1
}
echo -e "${GREEN}✅ SSH connection established.${NC}"

# Pull latest code from GitHub on EC2
echo -e "\n${BLUE}[2/4] Pulling latest code directly from GitHub (senoopsy/blogpost) on EC2...${NC}"
ssh -i "$KEY_PATH" "${EC2_USER}@${EC2_HOST}" 'bash -s' << 'PULL_COMMANDS'
set -e
APP_DIR="/home/ubuntu/blog-aggregator"

if [ ! -d "$APP_DIR/.git" ]; then
    echo "Cloning repository from GitHub..."
    git clone https://github.com/senoopsy/blogpost.git "$APP_DIR"
fi

cd "$APP_DIR"
echo "Fetching from origin main..."
git fetch origin main
git reset --hard origin/main
echo "EC2 working tree is now synchronized with GitHub main commit: $(git rev-parse --short HEAD)"
PULL_COMMANDS
echo -e "${GREEN}✅ EC2 synchronized with GitHub.${NC}"

# Configure server and launch containers
echo -e "\n${BLUE}[3/4] Provisioning Nginx and building production stack on EC2...${NC}"
ssh -i "$KEY_PATH" "${EC2_USER}@${EC2_HOST}" 'bash -s' << 'REMOTE_COMMANDS'
set -e

APP_DIR="/home/ubuntu/blog-aggregator"
cd "$APP_DIR"

echo "--> Building React frontend on EC2..."
cd "$APP_DIR/frontend"
npm ci || npm install
npm run build

echo "--> Stopping conflicting containers on port 80..."
docker stop devops_frontend_prod devops_backend_prod 2>/dev/null || true

echo "--> Checking Nginx installation..."
if ! command -v nginx &>/dev/null; then
    echo "Installing Nginx..."
    sudo apt-get update -y
    sudo apt-get install -y nginx
fi

echo "--> Syncing static assets to /var/www/senoopsy/dist..."
sudo mkdir -p /var/www/senoopsy/dist
sudo rm -rf /var/www/senoopsy/dist/*
sudo cp -r ~/blog-aggregator/frontend/dist/* /var/www/senoopsy/dist/
sudo chown -R www-data:www-data /var/www/senoopsy

echo "--> Configuring Nginx reverse proxy..."
sudo tee /etc/nginx/sites-available/senoopsy > /dev/null << 'NGINX_CONF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/senoopsy/dist;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    location ~ ^/(docs|openapi.json|redoc|health) {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
NGINX_CONF

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/senoopsy /etc/nginx/sites-enabled/senoopsy
sudo nginx -t
sudo systemctl restart nginx
echo "--> Nginx running on port 80!"

echo "--> Setting up backend/.env..."
cd ~/blog-aggregator
if [ ! -f backend/.env ]; then
    cat <<EOF > backend/.env
MONGODB_URL=mongodb://mongodb:27017
DATABASE_NAME=tech_news_aggregator
RSS_UPDATE_INTERVAL_MINUTES=15
USE_AI_SUMMARY=false
AI_API_KEY=
AI_MODEL=llama-3.3-70b-versatile
CORS_ORIGINS=http://localhost,http://3.109.3.45,http://127.0.0.1
EOF
fi

echo "--> Launching Docker Compose stack (MongoDB + FastAPI)..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true
docker compose -f docker-compose.prod.yml up -d --build

echo "--> Waiting for services to become healthy..."
for i in {1..30}; do
    if curl -sf http://127.0.0.1:8000/health > /dev/null; then
        echo "Backend is healthy!"
        break
    fi
    echo "Waiting for backend ($i/30)..."
    sleep 2
done

REMOTE_COMMANDS
echo -e "${GREEN}✅ Remote services configured and launched.${NC}"

# Verification
echo -e "\n${BLUE}[5/5] Running live verification against http://${EC2_HOST}...${NC}"
curl -s "http://${EC2_HOST}/health" || true
echo ""

echo -e "\n${CYAN}==================================================================${NC}"
echo -e "${GREEN}🎉 Deployment Successfully Completed!${NC}"
echo -e "${CYAN}==================================================================${NC}"
echo -e "Access your live app:"
echo -e "  🌐 Frontend:  ${YELLOW}http://${EC2_HOST}/${NC}"
echo -e "  ⚡ API Docs:  ${YELLOW}http://${EC2_HOST}/docs${NC}"
echo -e "  ❤️  Health:    ${YELLOW}http://${EC2_HOST}/health${NC}"
echo -e "${CYAN}==================================================================${NC}\n"
