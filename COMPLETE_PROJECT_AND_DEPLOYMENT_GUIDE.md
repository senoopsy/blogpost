# 📖 Senoopsy (TechPulse): The Complete Blueprint & End-to-End Deployment Journey

An exhaustive, start-to-finish technical record of **Senoopsy** — from concept, system architecture, and local prototyping to cloud provisioning, memory optimization, DevOps automation, troubleshooting, and custom domain HTTPS hosting.

---

## 📑 Table of Contents
1. [Project Vision & Core Problem](#1-project-vision--core-problem)
2. [Technology Stack & Architectural Rationale](#2-technology-stack--architectural-rationale)
3. [End-to-End System Architecture](#3-end-to-end-system-architecture)
4. [Memory Architecture for AWS Free Tier (1GB RAM)](#4-memory-architecture-for-aws-free-tier-1gb-ram)
5. [The Step-by-Step Chronological Journey](#5-the-step-by-step-chronological-journey)
6. [Mistakes, Roadblocks & Root-Cause Solutions (The Post-Mortem)](#6-mistakes-roadblocks--root-cause-solutions)
7. [Current Production State & Live Endpoints](#7-current-production-state--live-endpoints)
8. [Automated CI/CD Pipeline & Future Updates](#8-automated-cicd-pipeline--future-updates)
9. [Operational Cheat Sheet & Server Maintenance](#9-operational-cheat-sheet--server-maintenance)

---

## 1. Project Vision & Core Problem

### The Problem
Traditional RSS aggregators and tech news apps (Feedly, Google News, Flipboard) function as simple hyperlink directories:
- They send readers to ad-bloated third-party pages with paywalls, cookies, and tracking scripts.
- Readers frequently lose their place in the app.
- Technical specifications, leak reliability, and executive summaries are scattered and inconsistent.

### The Solution: Senoopsy (formerly TechPulse)
**Senoopsy** is an **autonomous, in-app tech publication and hardware intelligence terminal**:
1. **Continuous Radar**: It polls 25+ premier tech publications and supply-chain leakers (The Verge, 9to5Mac, MacRumors, Android Authority, XDA, GSMArena, Ars Technica) every 15 minutes.
2. **Full In-App Scraper**: It fetches complete article bodies, strips ads, trackers, and fluff, and isolates core reporting.
3. **Entity Recognition & Leaker Tracking**: It identifies tipsters (e.g. Ming-Chi Kuo, Ice Universe, Digital Chat Station, Ross Young) and assigns reliability ratings.
4. **AI Editorial Synthesis**: An LLM (via Groq / Llama 3.3) analyzes long-form reporting into **Executive Takeaways**, **Hardware Spec Matrices**, and **Market Impact Summaries**.
5. **Zero External Redirects**: Readers read complete, beautiful, synthesized stories inside an obsidian-themed minimalist interface with text-to-speech audio narration.

---

## 2. Technology Stack & Architectural Rationale

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| **Frontend Framework** | **React** | `v19` | Fast component-based UI with modern hooks and transitions. |
| **Frontend Tooling** | **Vite** | `v8.2.2` | Sub-second builds (510ms), native ES modules, low resource overhead. |
| **Styling System** | **Tailwind CSS + Custom CSS** | `v3.4` | Ultra-dark Obsidian aesthetic (`#090a0f`), glassmorphism, responsive cards. |
| **State Management** | **Redux Toolkit + RTK Query** | `v2.5` | Automated client caching, polling, deduplication, and optimistic updates. |
| **Icons & Typography** | **Lucide React + Outfit / Inter** | Latest | Lightweight vector iconography and editorial typography. |
| **Backend Framework** | **FastAPI** | `v0.115.6` | Asynchronous Python framework with native OpenAPI/Swagger and high throughput. |
| **ASGI Web Server** | **Uvicorn** | `v0.34.0` | High-performance async ASGI server with uvloop integration. |
| **Background Scheduler** | **APScheduler** | `v3.11.0` | In-process AsyncIOScheduler running alongside FastAPI in the application lifespan. |
| **Scraper & Cleaners** | **readability-lxml + lxml_html_clean** | Latest | Strips navigation, ads, and scripts to extract pure article text. |
| **AI Synthesis Engine** | **Groq SDK (Llama-3.3-70b-versatile)** | Latest | Ultra-low latency LLM inference for structuring takeaways and spec sheets. |
| **Database** | **MongoDB Community Server** | `v7.0` | Document database for unstructured RSS feeds, rich JSON entities, and metadata. |
| **Database Driver** | **Motor + PyMongo** | `v3.6.0` | Async Python driver for non-blocking I/O operations with MongoDB. |
| **Reverse Proxy** | **Host Nginx** | `v1.24.0` | Serves precompiled static React assets and reverse-proxies `/api/` to backend. |
| **SSL / HTTPS** | **Let's Encrypt / Certbot** | `v2.9.0` | Auto-renewing TLS 1.3 cryptographic certificates with 301 HTTPS enforcement. |
| **Containerization** | **Docker & Docker Compose** | `v2.28+` | Isolated production deployment with memory caps for MongoDB and FastAPI. |
| **CI/CD Automation** | **GitHub Actions** | `v4` | Automated linting, type-checking, bundle building, and SSH deployment on `main`. |
| **DNS Management** | **GoDaddy DNS** | - | Authoritative nameservers routing `senoopsy.com` to the AWS Elastic IP. |

---

## 3. End-to-End System Architecture

```
                                  DATA SOURCES
          ┌─────────────────────────────────────────────────────────┐
          │  • 25+ Tech RSS Feeds (The Verge, 9to5Mac, etc.)         │
          │  • Leaker Feeds & Tipsters (Ming-Chi Kuo, Ice Universe) │
          └────────────────────────────┬────────────────────────────┘
                                       │ (every 15 mins)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AWS EC2 INSTANCE (Ubuntu 24.04 LTS)                   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                            HOST NGINX                                 │  │
│  │   • Port 80 -> 301 Redirect to Port 443 (HTTPS)                       │  │
│  │   • SSL Termination (Let's Encrypt certbot auto-renew)                │  │
│  │   • /            -> Serves /var/www/senoopsy/dist (Static React SPA)  │  │
│  │   • /api/        -> Proxy Pass to 127.0.0.1:8000/api/                 │  │
│  │   • /docs, /health -> Proxy Pass to 127.0.0.1:8000                    │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│                                      ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      DOCKER COMPOSE PRODUCTION STACK                  │  │
│  │                                                                       │  │
│  │  ┌──────────────────────────────────┐  internal  ┌─────────────────┐  │  │
│  │  │ tech-news-backend-prod (FastAPI) │ ─────────> │ tech-news-      │  │  │
│  │  │   • Uvicorn ASGI Server          │   bridge   │ mongodb-prod    │  │  │
│  │  │   • APScheduler background task  │  network   │   • MongoDB 7   │  │  │
│  │  │   • Scraper & AI Synthesizer     │            │   • 256MB cache │  │  │
│  │  │   • Mem limit: 450MB             │            │   • 384MB limit │  │  │
│  │  └──────────────────────────────────┘            └─────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      ▲                                      │
│                                      │ git pull on push to main             │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
                                       ▼
               [ GitHub Actions CI/CD Pipeline: senoopsy/blogpost ]
                                       ▲
                                       │ git push origin main
               [ Local Developer Machine (MacBook) ]
```

---

## 4. Memory Architecture for AWS Free Tier (1GB RAM)

### The Challenge
AWS EC2 Free Tier instances (`t2.micro` or `t3.micro`) provide only **1 vCPU and 1 GB of RAM**.
In a standard unoptimized setup:
- MongoDB default WiredTiger cache allocates 50% of total RAM (~500MB).
- Node.js build processes consume 300MB - 600MB.
- Python FastAPI + APScheduler + Scraper consumes 150MB - 250MB.
- Running a Docker frontend container adds another 50MB.

**Total demand: ~1.4GB RAM.**
Without optimization, the Linux kernel Out-Of-Memory (OOM) Killer terminates MongoDB or Python instantly.

### The 4-Pillar Optimization Strategy
1. **2GB Swap Allocation**:
   - Created `/swapfile` with 2048MB storage.
   - Tuned `vm.swappiness=10` (system prefers physical RAM and only uses disk swap for dormant pages).
   - Tuned `vm.vfs_cache_pressure=50` to maintain inode caches.
2. **MongoDB Cache Capping**:
   - Added command: `["mongod", "--wiredTigerCacheSizeGB", "0.25"]`
   - Hard container memory ceiling: `mem_limit: 384m`
   - This prevents MongoDB from ever taking more than ~350MB of RAM.
3. **Zero-Container Frontend (Host Nginx Serving)**:
   - Instead of running an extra Docker container for the frontend, we compile Vite locally or on the host and copy static HTML/CSS/JS directly into `/var/www/senoopsy/dist/`.
   - Host Nginx serves static files using kernel-level `sendfile` with virtually zero RAM overhead.
4. **Backend Memory Limit**:
   - Restricted FastAPI container to `mem_limit: 450m` in `docker-compose.prod.yml`.

---

## 5. The Step-by-Step Chronological Journey

### Phase 1: Local Architecture & Prototyping
1. Designed data models: `Article`, `Source`, `Category` in MongoDB.
2. Created RSS feed ingestion scheduler (`services/scheduler.py` & `services/rss_service.py`).
3. Built scraper service using `readability-lxml` to fetch clean article bodies without ads.
4. Built React 19 frontend with Obsidian dark mode, pill filters, trending carousel, and in-app reader (`/article/:id`).
5. Verified local compilation with Vite (`npm run build` in 539ms).

### Phase 2: Local Pre-flight Verification
1. Identified local environment:
   - Mac had Python 3.11 in `backend/venv` and MongoDB active on port `27017`.
   - Docker was not installed on the Mac.
2. Modified `frontend/vite.config.ts` to add reverse-proxy rules for `/api` and `/health` to `http://localhost:8000`.
3. Added preview port `http://localhost:4173` to `CORS_ORIGINS` in `backend/config.py`.
4. Launched local FastAPI backend and Vite preview server on `http://localhost:4173`.
5. Automated browser subagent tested the UI, verifying category filters, lead stories, and live database streaming.

### Phase 3: Initial AWS EC2 Deployment
1. Located existing EC2 instance at `3.109.3.45` and SSH key `devops-journey.pem`.
2. Discovered existing `devops_frontend_prod` container bound to port 80.
3. User approved replacing existing port 80 containers with Senoopsy.
4. Stopped conflicting containers (`devops_frontend_prod`).
5. Installed Nginx on EC2 host and deployed static React assets to `/var/www/senoopsy/dist`.
6. Started MongoDB and FastAPI via `docker-compose.prod.yml`.
7. Encountered container crash with `lxml_html_clean`, resolved in `requirements.txt`, and redeployed.
8. Verified live endpoints on `http://3.109.3.45/` (557+ stories indexed).

### Phase 4: GitOps & CI/CD Transition
1. User noted that deploying via local `rsync` is an architectural anti-pattern and requested Git-driven deployments.
2. Created `.github/workflows/ci-cd.yml` defining full CI (build & test) and CD (automated SSH deployment to EC2).
3. Initialized local Git repository on branch `main` and created initial commit.
4. Pushed repository to `https://github.com/senoopsy/blogpost`.
5. Converted `~/blog-aggregator` on the EC2 server into an active Git clone tracking `senoopsy/blogpost` on `main`.
6. Generated Fine-Grained Personal Access Token with `Contents: Read & Write` permissions.
7. Prepared repository secrets (`EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`) for automated GitHub Actions rollout.

### Phase 5: GoDaddy DNS Configuration & Propagation
1. Located user's domain in GoDaddy: `senoopsy.com`.
2. Configured DNS records:
   - `A` Record: `@` ➔ `3.109.3.45` (TTL 1/2 hour).
   - `CNAME` Record: `www` ➔ `senoopsy.com` (TTL 1/2 hour).
3. Verified DNS resolution via global Google DNS (`dig +short senoopsy.com @8.8.8.8` returned `3.109.3.45`).

### Phase 6: Let's Encrypt SSL & HTTPS Activation
1. Installed `certbot` and `python3-certbot-nginx` on the EC2 Ubuntu host.
2. Executed a dry-run test (`sudo certbot certonly --nginx -d senoopsy.com --dry-run`), which succeeded.
3. Issued official production certificate:
   `sudo certbot --nginx -d senoopsy.com --non-interactive --agree-tos --register-unsafely-without-email --redirect`
4. Automated 301 HTTP-to-HTTPS redirect was installed in Nginx.
5. Browser subagent verified live HTTPS lock icon on `https://senoopsy.com`.

---

## 6. Mistakes, Roadblocks & Root-Cause Solutions

This section details every roadblock, bug, or architectural mistake encountered, the diagnosis, and the exact fix applied.

---

### 🚨 Roadblock 1: Attempting to Run Docker Locally on Mac
- **Symptom**:
  ```bash
  zsh:1: command not found: docker
  ```
- **Root Cause**: Docker Desktop was not installed on the user's local Mac workstation. Attempting to run `docker-compose` locally would fail.
- **Diagnosis**:
  Ran environment discovery commands:
  - `which mongod` revealed MongoDB was already installed via Homebrew (`/opt/homebrew/bin/mongod`) and running as a service.
  - `backend/venv` already had Python 3.11 with all dependencies installed.
  - `frontend/node_modules` was already installed.
- **Solution**:
  Instead of forcing the user to install a 2GB Docker Desktop app, we ran:
  1. Backend locally via `./backend/venv/bin/uvicorn main:app --port 8000`.
  2. Built frontend locally with `npm run build` in `frontend/`.
  3. Configured `frontend/vite.config.ts` with proxy rules for `/api` and `/health` so that `npm run preview -- --port 4173` accurately mirrored the production Nginx reverse proxy.
  - Result: Fast local verification of the exact production bundle without needing Docker locally.

---

### 🚨 Roadblock 2: FastAPI Trailing Slash 307 Redirects
- **Symptom**:
  Running `curl -s http://127.0.0.1:8000/api/categories` returned empty output or unexpected behavior.
- **Root Cause**:
  FastAPI's router was defined with `@router.get("/")` inside `routes/categories.py`, making the canonical path `/api/categories/` (with a trailing slash). When accessed without the trailing slash, FastAPI issued a `307 Temporary Redirect`. Plain `curl` does not follow redirects by default.
- **Solution**:
  1. Tested with `curl -sL http://127.0.0.1:8000/api/categories/` (with `-L` flag and trailing slash), which returned full JSON immediately.
  2. Ensured Nginx proxy rules pass through URI paths cleanly using `proxy_pass http://127.0.0.1:8000/api/;`.

---

### 🚨 Roadblock 3: Port 80 Collision on AWS EC2
- **Symptom**:
  When inspecting the target EC2 instance (`3.109.3.45`), `docker ps` revealed:
  ```
  0.0.0.0:80->80/tcp  devops_frontend_prod
  ```
  Another production project (`devops-journey`) was occupying port 80.
- **Root Cause**:
  Binding Nginx to port 80 would fail with `bind() to 0.0.0.0:80 failed (98: Address already in use)`.
- **Diagnosis & Clarification**:
  Used `ask_question` to ask the user whether to replace the container, run on an alternate port (e.g. 8080), or use a new instance. The user explicitly chose: *"Replace the existing devops-journey containers and take over port 80"*.
- **Solution**:
  Executed:
  ```bash
  docker stop devops_frontend_prod devops_backend_prod 2>/dev/null || true
  ```
  This cleanly released port 80 for Nginx, while leaving the existing PostgreSQL database (`devops_postgres_prod`) safely untouched on port 5432.

---

### 🚨 Roadblock 4: Backend Container Crash on EC2 (`ImportError: lxml.html.clean`)
- **Symptom**:
  After launching `docker compose -f docker-compose.prod.yml up -d --build` on EC2, accessing `http://3.109.3.45/health` returned `502 Bad Gateway`.
- **Diagnosis**:
  Ran `docker logs tech-news-backend-prod --tail 50` on EC2. Found this traceback:
  ```python
    File "/usr/local/lib/python3.11/site-packages/readability/cleaners.py", line 3, in <module>
      from lxml.html.clean import Cleaner
    File "/usr/local/lib/python3.11/site-packages/lxml/html/clean.py", line 18, in <module>
      raise ImportError(
  ImportError: lxml.html.clean module is now a separate project lxml_html_clean.
  Install lxml[html_clean] or lxml_html_clean directly.
  ```
- **Root Cause**:
  In modern releases of `lxml` (`>=5.2.0`), `lxml.html.clean` was deprecated and extracted into a standalone library `lxml_html_clean`. In the local virtual environment, `lxml_html_clean` was installed, but in `backend/requirements.txt`, it was missing. Inside the clean Docker container, pip installed `lxml==5.3.0` without `lxml_html_clean`, causing the scraper service to fail on startup.
- **Solution**:
  Updated [backend/requirements.txt](file:///Users/rahul/blog-aggregator/backend/requirements.txt):
  ```diff
   lxml==5.3.0
  +lxml_html_clean>=0.4.0
  -readability-lxml==0.8.1
  +readability-lxml>=0.8.1
  ```
  Rebuilt the container with `docker compose -f docker-compose.prod.yml up -d --build`. The backend started up instantly and returned `{"status":"healthy"}` in 2 seconds.

---

### 🚨 Roadblock 5: Architectural Anti-Pattern (Local Rsync Direct Sync)
- **Symptom / Critique**:
  The user correctly noted: *"no that is a not good architecture right dont you know that? did you move everything like take from github instead what you have directly taking from my local to ec2 server did you moved?"*
- **Root Cause**:
  The initial rollout script used `rsync` over SSH from local laptop to EC2. While fast for a one-off proof-of-concept, it completely bypassed:
  - Git version control.
  - Pull request review & commit tracking.
  - Automated CI/CD test runners.
  - Single Source of Truth on GitHub.
- **Solution**:
  1. Built full GitHub Actions pipeline [`.github/workflows/ci-cd.yml`](file:///Users/rahul/blog-aggregator/.github/workflows/ci-cd.yml).
  2. Hardened [`.gitignore`](file:///Users/rahul/blog-aggregator/.gitignore) to protect `.env`, `*.pem`, `*.key`.
  3. Committed and pushed the entire codebase to GitHub at `https://github.com/senoopsy/blogpost`.
  4. Converted `~/blog-aggregator` on the EC2 server into an active Git clone:
     ```bash
     cd ~/blog-aggregator
     git init
     git remote add origin https://github.com/senoopsy/blogpost.git
     git fetch origin main
     git reset --hard origin/main
     git branch --set-upstream-to=origin/main main
     ```
  5. Refactored `scripts/deploy-to-ec2.sh` to eliminate `rsync` and pull directly from `origin main`.

---

### 🚨 Roadblock 6: GitHub 403 Forbidden Error on Push
- **Symptom**:
  ```bash
  remote: Permission to senoopsy/blogpost.git denied to rahuldoty.
  fatal: unable to access 'https://github.com/senoopsy/blogpost/': The requested URL returned error: 403
  ```
- **Root Cause**:
  The user's macOS Keychain had saved credentials for GitHub user `rahuldoty`. When attempting to push to the organization/account `senoopsy/blogpost`, GitHub rejected the push because `rahuldoty` lacked write permissions.
- **Solution**:
  Guided the user to generate a **Fine-Grained Personal Access Token** under `senoopsy`:
  - Token repository scope: `Only select repositories` ➔ `blogpost`.
  - Repository permissions: `Contents: Read and write`.
  - Once authenticated, `git push -u origin main` succeeded with exit code 0.

---

### 🚨 Roadblock 7: GoDaddy DNS WWW CNAME Misconfiguration
- **Symptom**:
  `senoopsy.com` resolved immediately to `3.109.3.45`, but `www.senoopsy.com` did not resolve.
- **Root Cause**:
  In GoDaddy's DNS dashboard, entering `@` as the `Data` target for a `CNAME` record is often rejected or ignored by GoDaddy's DNS parser. CNAME records require a Fully Qualified Domain Name (e.g. `senoopsy.com`), or an `A` record must be used for `www`.
- **Solution**:
  1. Verified root domain `senoopsy.com` was resolving cleanly.
  2. Issued the primary Let's Encrypt certificate for `senoopsy.com` first so the live site on HTTPS was not delayed.
  3. Recommended updating GoDaddy DNS to either use `Data: senoopsy.com` on the CNAME, or an `A` record with Name `www` and Points to `3.109.3.45`.

---

### 🚨 Roadblock 8: GitHub Actions CD Failure Due to Missing Node.js on EC2 (`npm: command not found`)
- **Symptom**:
  In GitHub Actions, the Continuous Integration (CI) job passed 100%, but the Continuous Deployment (CD) job `Deploy to AWS EC2` failed with exit code 127:
  ```bash
  bash: line 8: npm: command not found
  ```
- **The Core Question / Architectural Paradox**:
  *"If Node.js wasn't installed on the server, why was the production website already working live and perfectly on https://senoopsy.com earlier?"*
- **Root-Cause Analysis (Runtime vs. Build Time)**:
  - **At Run Time (Serving Visitors)**:
    React is a client-side technology. Once compiled, it consists solely of static text files (`index.html`, `index.css`, `index.js`). **Nginx (written in C)** serves these files directly from the hard drive (`/var/www/senoopsy/dist`) to the visitor's browser. The visitor's browser runs the JavaScript. The backend runs inside Python. **Node.js is NEVER running and consumes 0% CPU and 0 MB RAM at runtime.**
  - **At Build Time (Compiling Code)**:
    In GitHub, you only store raw TypeScript (`.tsx`) source code; the compiled `dist/` directory is intentionally git-ignored. When GitHub Actions SSHes into EC2 to deploy, it pulls the raw `.tsx` files and needs a **compiler** to run `npm run build` and produce the new HTML/JS files.
  - **Why it worked earlier**:
    During initial testing, the compilation happened on the developer's **MacBook**, and the pre-built `dist/` folder was copied over. But when we automated deployments via GitHub Actions, the server had to build the files autonomously without relying on anyone's laptop.
- **Solution**:
  1. Installed Node.js 20.x LTS and npm on the Ubuntu EC2 host:
     ```bash
     curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
     sudo apt-get install -y nodejs
     ```
  2. Verified installation: `node -v` (`v20.20.2`) and `npm -v` (`10.8.2`).
  3. Re-triggered the GitHub Actions CI/CD workflow:
     - **CI Job (Build & Validate)**: Passed ✅
     - **CD Job (Deploy to AWS EC2)**: Passed ✅
     - **Total Pipeline Status**: 100% Success (Green Checkmark 🟢).

---

## 7. Current Production State & Live Endpoints

The application is fully operational in production:

| Service | Live URL | Protocol | Health / Status |
|---|---|---|---|
| **Production Frontend** | **[https://senoopsy.com/](https://senoopsy.com/)** | HTTPS (SSL 🔒) | 🟢 100% Operational |
| **API Health Check** | **[https://senoopsy.com/health](https://senoopsy.com/health)** | HTTPS (SSL 🔒) | 🟢 `{"status":"healthy"}` |
| **FastAPI Swagger Docs** | **[https://senoopsy.com/docs](https://senoopsy.com/docs)** | HTTPS (SSL 🔒) | 🟢 Interactive OpenAPI UI |
| **Category API** | **[https://senoopsy.com/api/categories/](https://senoopsy.com/api/categories/)** | HTTPS (SSL 🔒) | 🟢 9 Categories Populated |
| **Articles Feed API** | **[https://senoopsy.com/api/articles/](https://senoopsy.com/api/articles/)** | HTTPS (SSL 🔒) | 🟢 557+ Stories Indexed |
| **HTTP Redirect** | `http://senoopsy.com/` | HTTP (Port 80) | 🟢 301 Permanent Redirect to HTTPS |
| **Direct Server IP** | `http://3.109.3.45/` | HTTP (Port 80) | 🟢 Direct Host Endpoint |
| **GitHub Repository** | **[senoopsy/blogpost](https://github.com/senoopsy/blogpost)** | Git (HTTPS/SSH) | 🟢 Main Branch Synchronized |

---

## 8. Automated CI/CD Pipeline & Future Updates

The GitHub Actions workflow at [`.github/workflows/ci-cd.yml`](file:///Users/rahul/blog-aggregator/.github/workflows/ci-cd.yml) automates the entire software delivery lifecycle:

### The Automated Workflow Stages:
```
[ Developer Push to main ]
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Continuous Integration (CI Job: Build & Validate)       │
│    • Checkout code via actions/checkout@v4                  │
│    • Set up Python 3.11 & install backend dependencies      │
│    • Validate Python code: py_compile main.py config.py     │
│    • Set up Node.js 20 & install frontend dependencies      │
│    • Compile React production bundle (npm run build)        │
│    • Validate Docker Compose configuration                  │
│    • Test build production Docker container                 │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼ (Only if CI passes)
┌─────────────────────────────────────────────────────────────┐
│ 2. Continuous Deployment (CD Job: Deploy to AWS EC2)        │
│    • Connects to EC2 via appleboy/ssh-action@v1.0.3         │
│    • Runs: git fetch origin main && git reset --hard        │
│    • Compiles new frontend bundle on EC2                    │
│    • Copies static assets to /var/www/senoopsy/dist/        │
│    • Rebuilds and restarts production Docker containers     │
│    • Reloads Nginx (zero downtime)                          │
│    • Prunes dangling Docker images to preserve disk space   │
└─────────────────────────────────────────────────────────────┘
```

### Required GitHub Secrets
To activate the automated deployment on push, these 3 secrets must be configured in:
👉 **`https://github.com/senoopsy/blogpost/settings/secrets/actions`**

1. **`EC2_HOST`**: `3.109.3.45`
2. **`EC2_USER`**: `ubuntu`
3. **`EC2_SSH_KEY`**: The complete text of `/Users/rahul/Downloads/devops-journey.pem` (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`).

---

## 9. Operational Cheat Sheet & Server Maintenance

### How to SSH into the Server
```bash
ssh -i /Users/rahul/Downloads/devops-journey.pem ubuntu@3.109.3.45
```

### Inspecting Backend Logs in Real Time
```bash
docker compose -f ~/blog-aggregator/docker-compose.prod.yml logs -f backend
```

### Checking System Memory & Swap
```bash
free -h
# Output should show ~2.0Gi Mem and ~2.0Gi Swap
```

### Monitoring Container Memory
```bash
docker stats --no-stream
```

### Restarting Services
```bash
# Restart Docker services
docker compose -f ~/blog-aggregator/docker-compose.prod.yml restart

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

### Manual Trigger for Let's Encrypt Renewal Check
```bash
sudo certbot renew --dry-run
```
*(Certbot automatically runs renewal timers twice daily via systemd).*

### Re-deploying from Local Mac via CLI
Whenever you make changes, commit and push to Git:
```bash
git add .
git commit -m "feat: your new feature"
git push origin main
```
Or execute the deployment helper:
```bash
make ec2-deploy
# or: ./scripts/deploy-to-ec2.sh
```

---

*This document serves as the permanent, authoritative architectural and operational specification for Senoopsy.*
