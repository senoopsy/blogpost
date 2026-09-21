#!/usr/bin/env bash
# ==============================================================================
# Senoopsy (TechPulse) — Automated AWS EC2 Free Tier Provisioning Script
# Target OS: Ubuntu 22.04 LTS / Ubuntu 24.04 LTS
# ==============================================================================

set -e

# Color helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}==================================================================${NC}"
echo -e "${CYAN}   🚀 Senoopsy AWS EC2 Free Tier Provisioning & Setup Engine      ${NC}"
echo -e "${CYAN}==================================================================${NC}"

# Check for root / sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Please run this script with sudo: sudo ./scripts/setup-ec2.sh${NC}"
  exit 1
fi

REAL_USER="${SUDO_USER:-$USER}"

# ------------------------------------------------------------------------------
# STEP 1: CONFIGURE 2GB SWAP (Crucial for 1GB RAM EC2 Instances)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[1/7] Checking Swap Space (Preventing 1GB RAM OOM Crashes)...${NC}"
if swapon --show | grep -q "/swapfile"; then
    echo -e "${GREEN}✅ Swap file already active.${NC}"
else
    echo -e "${YELLOW}⚙️  Allocating 2GB swap file...${NC}"
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile

    if ! grep -q "/swapfile" /etc/fstab; then
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi

    # Tune swappiness for server workloads
    sysctl vm.swappiness=10
    sysctl vm.vfs_cache_pressure=50
    if ! grep -q "vm.swappiness=10" /etc/sysctl.conf; then
        echo "vm.swappiness=10" >> /etc/sysctl.conf
        echo "vm.vfs_cache_pressure=50" >> /etc/sysctl.conf
    fi
    echo -e "${GREEN}✅ 2GB Swap space successfully created and configured!${NC}"
fi

# ------------------------------------------------------------------------------
# STEP 2: SYSTEM UPDATE & BASE PACKAGES
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[2/7] Updating system packages & installing core dependencies...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl wget git ufw nginx certbot python3-certbot-nginx ca-certificates gnupg lsb-release

# ------------------------------------------------------------------------------
# STEP 3: DOCKER & DOCKER COMPOSE INSTALLATION
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[3/7] Setting up Docker Engine & Docker Compose...${NC}"
if ! command -v docker &> /dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker

    usermod -aG docker "$REAL_USER"
    echo -e "${GREEN}✅ Docker installed and user added to docker group.${NC}"
else
    echo -e "${GREEN}✅ Docker already installed.${NC}"
fi

# ------------------------------------------------------------------------------
# STEP 4: NODE.JS 20 LTS (For native frontend builds on host)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[4/7] Checking Node.js runtime...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚙️  Installing Node.js 20 LTS via NodeSource...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}✅ Node.js $(node -v) and npm $(npm -v) installed.${NC}"
else
    echo -e "${GREEN}✅ Node.js $(node -v) already installed.${NC}"
fi

# ------------------------------------------------------------------------------
# STEP 5: FIREWALL CONFIGURATION (UFW)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[5/7] Configuring UFW Firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo -e "${GREEN}✅ Firewall active: Ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) are OPEN.${NC}"

# ------------------------------------------------------------------------------
# STEP 6: DIRECTORY PREPARATION & NGINX SETUP
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[6/7] Configuring Nginx Site & Web Directory...${NC}"
mkdir -p /var/www/senoopsy/dist
chown -R "$REAL_USER":"$REAL_USER" /var/www/senoopsy

# Check for domain parameter or prompt interactively
DOMAIN="$1"
if [ -z "$DOMAIN" ]; then
    echo -e "${CYAN}Please enter your domain name (e.g., example.com):${NC}"
    read -r -p "Domain: " DOMAIN
fi

if [ -n "$DOMAIN" ]; then
    echo -e "${YELLOW}Configuring Nginx for domain: ${DOMAIN}${NC}"
    
    # Check if custom template exists
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    CONF_TEMPLATE="$SCRIPT_DIR/../nginx/production.conf"
    
    if [ -f "$CONF_TEMPLATE" ]; then
        sed "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" "$CONF_TEMPLATE" > /etc/nginx/sites-available/senoopsy
    else
        cat <<EOF > /etc/nginx/sites-available/senoopsy
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    root /var/www/senoopsy/dist;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    location ~ ^/(docs|openapi.json|redoc|health) {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
EOF
    fi

    ln -sf /etc/nginx/sites-available/senoopsy /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t
    systemctl reload nginx
    echo -e "${GREEN}✅ Nginx configured and reloaded for ${DOMAIN}.${NC}"
fi

# ------------------------------------------------------------------------------
# STEP 7: SSL SETUP (Let's Encrypt / Certbot)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[7/7] SSL (HTTPS) Configuration...${NC}"
if [ -n "$DOMAIN" ]; then
    echo -e "${YELLOW}Have you already configured your DNS A-Record pointing '${DOMAIN}' to this EC2 public IP? (y/N):${NC}"
    read -r -p "DNS Configured? [y/N]: " DNS_READY
    if [[ "$DNS_READY" =~ ^[Yy]$ ]]; then
        echo -e "${CYAN}Please enter your email for Let's Encrypt renewal notices:${NC}"
        read -r -p "Email: " CERT_EMAIL
        if [ -n "$CERT_EMAIL" ]; then
            certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$CERT_EMAIL" --redirect || {
                echo -e "${YELLOW}⚠️  Certbot encountered an issue. You can run it manually anytime after DNS propagates:${NC}"
                echo -e "   sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
            }
        fi
    else
        echo -e "${YELLOW}ℹ️  Skipping Certbot for now. Once your DNS propagates, simply run:${NC}"
        echo -e "   ${GREEN}sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}${NC}"
    fi
fi

echo -e "\n${CYAN}==================================================================${NC}"
echo -e "${GREEN}🎉 Base EC2 Server Provisioning Complete!${NC}"
echo -e "${CYAN}==================================================================${NC}"
echo -e "Next steps to run the application:"
echo -e "  1. Copy your environment file: ${YELLOW}cp backend/.env.example backend/.env${NC} (and edit variables)"
echo -e "  2. Deploy application:         ${YELLOW}./deploy.sh${NC}"
echo -e "  3. Monitor system memory:      ${YELLOW}free -m${NC} and ${YELLOW}docker stats${NC}"
echo -e "${CYAN}==================================================================${NC}\n"
