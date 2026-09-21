# 🚀 Complete AWS EC2 Free Tier & Custom Domain Deployment Guide

This guide walks you through deploying **Senoopsy (TechPulse)** onto an **AWS EC2 Free Tier instance (`t2.micro` or `t3.micro`)** with automated SSL (HTTPS) and custom domain hosting.

---

## 📑 Quick Navigation
1. [Prerequisites & Architecture](#1-prerequisites--architecture)
2. [Step 1: Launch EC2 Free Tier Instance](#step-1-launch-ec2-free-tier-instance)
3. [Step 2: Allocate an Elastic IP (Static IP)](#step-2-allocate-an-elastic-ip-static-ip)
4. [Step 3: Point Your Custom Domain (DNS Records)](#step-3-point-your-custom-domain-dns-records)
5. [Step 4: Connect to EC2 via SSH](#step-4-connect-to-ec2-via-ssh)
6. [Step 5: Clone Repository & Run One-Command Setup](#step-5-clone-repository--run-one-command-setup)
7. [Step 6: Configure Environment & Deploy](#step-6-configure-environment--deploy)
8. [Step 7: Verify SSL & App Health](#step-7-verify-ssl--app-health)
9. [Database Optimization (Local MongoDB vs MongoDB Atlas)](#database-optimization)
10. [Ongoing Operations & Future Updates](#ongoing-operations--future-updates)

---

## 1. Prerequisites & Architecture

- **AWS Account**: An active AWS account eligible for Free Tier.
- **Custom Domain**: A domain registered with any provider (e.g. GoDaddy, Namecheap, Cloudflare, Route 53, Hostinger).
- **SSH Key Pair**: Downloaded `.pem` file from AWS.

### Why this architecture is optimized for 1GB RAM:
AWS Free Tier instances come with **1 vCPU and 1 GB RAM**. Running Python, MongoDB, Node build, and background schedulers can easily trigger out-of-memory (OOM) crashes without optimization:
- ✅ **2GB Swap Space**: Automatically configured by our script to prevent OOM kills.
- ✅ **Host Nginx for Frontend**: Serves static React build directly with zero container overhead (saving 50MB+ RAM).
- ✅ **WiredTiger Memory Cap**: MongoDB memory usage is capped at 256MB.
- ✅ **Unified Origin**: Nginx handles both frontend and proxies `/api/` to FastAPI, eliminating all CORS issues.

---

## Step 1: Launch EC2 Free Tier Instance

1. Log into the [AWS Management Console](https://console.aws.amazon.com/) and navigate to **EC2** > **Instances** > **Launch instances**.
2. **Name**: `senoopsy-server`
3. **Application and OS Images (Amazon Machine Image)**:
   - Select **Ubuntu** (Choose **Ubuntu Server 22.04 LTS (HVM)**, 64-bit x86).
4. **Instance Type**:
   - Select **`t2.micro`** (or **`t3.micro`** depending on your region's Free Tier eligibility).
5. **Key Pair (Login)**:
   - Click **Create new key pair** (or select an existing one).
   - Name: `senoopsy-key`
   - Key pair type: `RSA`, Private key file format: `.pem`
   - Download the `.pem` file and store it safely on your local machine.
6. **Network Settings**:
   - Check **Allow SSH traffic from** -> `My IP` (or `Anywhere 0.0.0.0/0` if your IP is dynamic).
   - Check **Allow HTTP traffic from the internet** (Port 80).
   - Check **Allow HTTPS traffic from the internet** (Port 443).
7. **Configure Storage**:
   - Change `8 GiB` to **`30 GiB`** (AWS Free Tier includes up to 30 GB of General Purpose SSD gp3/gp2 storage for free!).
8. Click **Launch instance**.

---

## Step 2: Allocate an Elastic IP (Static IP)

*Important: By default, standard EC2 public IPs change every time an instance is stopped or restarted. An Elastic IP gives you a permanent static IP for your domain.*

1. In the EC2 left sidebar, go to **Network & Security** > **Elastic IPs**.
2. Click **Allocate Elastic IP address** > Click **Allocate**.
3. Select your new Elastic IP > Click **Actions** > **Associate Elastic IP address**.
4. Resource type: **Instance** > Select your newly launched instance (`senoopsy-server`).
5. Click **Associate**.
6. Note down your **Allocated IPv4 Address** (e.g., `54.210.120.30`).

---

## Step 3: Point Your Custom Domain (DNS Records)

Go to your domain registrar's DNS settings (Cloudflare, GoDaddy, Namecheap, Route 53, Hostinger, etc.) and add/edit the following records:

| Type | Name / Host | Target / Value | TTL |
|------|-------------|----------------|-----|
| **A** | `@` (or leave empty) | `YOUR_ELASTIC_IP` (e.g. `54.210.120.30`) | Automatic or 5 min |
| **CNAME** | `www` | `yourdomain.com` (or A record to `YOUR_ELASTIC_IP`) | Automatic or 5 min |

*(If using Cloudflare, make sure the proxy cloud is set to DNS Only / Grey cloud during initial SSL issuance, or leave it as full SSL).*

You can verify propagation on your local machine terminal:
```bash
nslookup yourdomain.com
# or
dig yourdomain.com +short
```

---

## Step 4: Connect to EC2 via SSH

Open your computer's terminal and navigate to the directory where your `.pem` key was downloaded:

```bash
# 1. Set correct permissions for private key
chmod 400 senoopsy-key.pem

# 2. SSH into your Ubuntu EC2 server
ssh -i senoopsy-key.pem ubuntu@YOUR_ELASTIC_IP
```

---

## Step 5: Clone Repository & Run One-Command Setup

Once inside your EC2 terminal:

```bash
# 1. Clone your repository
git clone https://github.com/YOUR_USERNAME/blog-aggregator.git
cd blog-aggregator

# 2. Run the automated provisioning script with your domain name:
sudo ./scripts/setup-ec2.sh yourdomain.com
```

### What `setup-ec2.sh` does automatically:
1. Allocates and activates **2GB Swap space** (prevents memory exhaustion).
2. Updates Ubuntu packages and installs **Docker**, **Docker Compose**, **Node.js 20 LTS**, and **Nginx**.
3. Configures the **UFW Firewall** (allowing 22, 80, 443).
4. Configures Nginx with reverse proxy for `/api/` and static SPA routing for the React frontend.
5. Runs **Certbot** to automatically obtain and install a free **Let's Encrypt SSL Certificate** with auto-renewing HTTPS.

---

## Step 6: Configure Environment & Deploy

### 1. Configure Backend Environment
```bash
# Copy template
cp backend/.env.example backend/.env

# Open and edit with nano
nano backend/.env
```

Set your configuration:
```env
MONGODB_URL=mongodb://mongodb:27017
DATABASE_NAME=tech_news_aggregator
RSS_UPDATE_INTERVAL_MINUTES=15
USE_AI_SUMMARY=false
AI_API_KEY=your_groq_api_key_here
AI_MODEL=llama-3.3-70b-versatile
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,http://localhost
```
*(Press `Ctrl+O` then `Enter` to save, and `Ctrl+X` to exit nano).*

### 2. Run the Deployment Script
```bash
./deploy.sh
```

### What `deploy.sh` does:
- Compiles the React production bundle using Vite.
- Copies the static assets to `/var/www/senoopsy/dist/`.
- Builds and starts MongoDB and FastAPI backend via `docker-compose.prod.yml`.
- Runs automated health checks and reloads Nginx.

---

## Step 7: Verify SSL & App Health

1. **Open your web browser**:
   - Visit `https://yourdomain.com`
   - You should see the sleek obsidian Senoopsy interface with a valid HTTPS lock icon 🔒.
2. **Check API Health**:
   - `https://yourdomain.com/health` -> `{"status":"healthy"}`
   - `https://yourdomain.com/docs` -> FastAPI Swagger interactive documentation.
3. **Check Backend Logs**:
   ```bash
   docker compose -f docker-compose.prod.yml logs -f backend
   ```
   You should see:
   ```
   Starting up...
   Connecting to MongoDB...
   MongoDB connected!
   Starting RSS scheduler...
   Scheduler started!
   ```

---

## Database Optimization

### Option A: Local MongoDB (Default)
Our `docker-compose.prod.yml` restricts MongoDB's internal WiredTiger cache:
```yaml
command: ["mongod", "--wiredTigerCacheSizeGB", "0.25"]
mem_limit: 384m
```
This ensures MongoDB never consumes more than ~350MB of RAM.

### Option B: Free Cloud MongoDB Atlas (Recommended for Zero EC2 RAM Load)
If you want to free up 350MB of RAM on your EC2 instance entirely:
1. Create a free M0 cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Database User and allow Network Access from `0.0.0.0/0`.
3. Copy your connection string: `mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority`
4. Update `backend/.env`:
   ```env
   MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority
   ```
5. Restart backend:
   ```bash
   docker compose -f docker-compose.prod.yml restart backend
   ```

---

## Ongoing Operations & Future Updates

### 🔄 How to Deploy Code Updates
Whenever you push changes to your GitHub repository, updating your live server takes one command:
```bash
cd ~/blog-aggregator
git pull
./deploy.sh
```

### 📊 Monitoring Memory & Containers
```bash
# Check memory and swap usage:
free -m

# Check live container CPU and Memory usage:
docker stats --no-stream
```

### 📜 Viewing Service Logs
```bash
# Backend logs:
docker compose -f docker-compose.prod.yml logs -f backend

# MongoDB logs:
docker compose -f docker-compose.prod.yml logs -f mongodb

# Nginx access and error logs:
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 🔒 SSL Renewal Check
Certbot automatically sets up a systemd renewal timer. To test that renewals will succeed:
```bash
sudo certbot renew --dry-run
```

---

## 🛠️ Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| **Site cannot be reached** | AWS Security Group not allowing port 80/443 | In AWS Console > Security Groups > Inbound rules, add HTTP (80) and HTTPS (443) from `0.0.0.0/0`. |
| **Certbot DNS Verification Failed** | Domain A-record hasn't propagated | Wait 5 minutes and verify with `nslookup yourdomain.com`. Then rerun `sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com`. |
| **Build fails with Out of Memory** | Swap not active | Run `swapon --show`. If empty, run `sudo ./scripts/setup-ec2.sh` to configure the 2GB swapfile. |
| **502 Bad Gateway on `/api/`** | Backend container still starting or crashed | Check backend logs: `docker compose -f docker-compose.prod.yml logs backend`. |
