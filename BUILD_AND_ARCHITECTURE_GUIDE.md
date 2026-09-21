# TechPulse — Full Architecture & Build Process Guide

An end-to-end technical breakdown of how **TechPulse** was engineered into an autonomous, AI-powered tech journalism and supply-chain intelligence platform inspired by **The Verge, Gadgets 360, 9to5Google, and Android Police**.

---

## 📑 Table of Contents
1. [Executive Overview](#1-executive-overview)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [Backend Engineering & AI Processing Pipeline](#3-backend-engineering--ai-processing-pipeline)
   - [3.1 RSS Ingestion & Scheduling](#31-rss-ingestion--scheduling)
   - [3.2 Web Scraper & HTML Sanitization](#32-web-scraper--html-sanitization)
   - [3.3 Leaker & Tipster Entity Recognition](#33-leaker--tipster-entity-recognition)
   - [3.4 AI Editorial Synthesis Engine](#34-ai-editorial-synthesis-engine)
   - [3.5 On-Demand Enrichment Lifecycle](#35-on-demand-enrichment-lifecycle)
4. [Database & Data Models](#4-database--data-models)
5. [Frontend Architecture & Minimalist Design System](#5-frontend-architecture--minimalist-design-system)
   - [5.1 In-App Reading Experience (Zero Redirects)](#51-in-app-reading-experience-zero-redirects)
   - [5.2 Minimalist Design Language](#52-minimalist-design-language)
   - [5.3 State Management & RTK Query](#53-state-management--rtk-query)
6. [Step-by-Step Build & Setup Instructions](#6-step-by-step-build--setup-instructions)
7. [Directory Structure & Sitemap](#7-directory-structure--sitemap)

---

## 1. Executive Overview

### The Problem
Traditional news aggregators merely fetch RSS feeds and hyperlink users away to third-party websites filled with ads, pop-ups, and paywalls. Users lose context and leave the application.

### The Solution
**TechPulse** is a **fully autonomous in-app publication**:
1. It continuously monitors 25+ premier tech publications and supply-chain leakers (The Verge, 9to5Mac, MacRumors, Android Authority, XDA, etc.).
2. When a story or leak breaks, it **scrapes full article bodies**, strips noise and ads, and extracts technical entities.
3. An **AI Editorial Synthesis Engine** transforms the raw information into structured, multi-section tech journalism complete with **Executive Takeaways**, **Detailed Technical Specification Matrices**, and **Leaker Track Record Ratings**.
4. The stories are rendered **100% inside the app** with a minimalist, high-contrast dark aesthetic.

---

## 2. High-Level System Architecture

```
                                  DATA SOURCES
          ┌─────────────────────────────────────────────────────────┐
          │  • 25+ Tech RSS Feeds (The Verge, 9to5Mac, etc.)         │
          │  • Leaker Feeds & Tipsters (Ming-Chi Kuo, Ice Universe) │
          │  • Custom Ingest API (X / Twitter Leak Submissions)     │
          └────────────────────────────┬────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND ENGINE (FastAPI)                           │
│                                                                             │
│  ┌─────────────────────────┐         ┌───────────────────────────────────┐  │
│  │ 1. RSS Fetcher &        │ ──────> │ 2. Web Scraper & Sanitizer        │  │
│  │    APScheduler Engine   │         │    (httpx + readability-lxml)     │  │
│  └─────────────────────────┘         └─────────────────┬─────────────────┘  │
│                                                        │                    │
│                                                        ▼                    │
│  ┌─────────────────────────┐         ┌───────────────────────────────────┐  │
│  │ 4. MongoDB Database     │ <────── │ 3. AI Editorial Synthesizer       │  │
│  │    (Articles & Sources) │         │    (Groq LLM / Local Synthesizer) │  │
│  └────────────┬────────────┘         └───────────────────────────────────┘  │
│               │                                                             │
│               ▼                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 5. FastAPI REST Endpoints (/api/articles, /api/categories, /docs)     │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │ JSON API
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FRONTEND UI (React 19 + Vite)                         │
│                                                                             │
│  • Minimalist Obsidian Canvas (#090a0f) & Pill Navigation                   │
│  • In-App Reader at /article/:id (Zero External Redirection)                │
│  • Executive Takeaways Box & Technical Specs Matrix                         │
│  • Audio Narrator (Text-to-Speech), Font Size Switcher & Social Sharing     │
│  • Leaks & Rumor Radar with Analyst Accuracy Gauges                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Backend Engineering & AI Processing Pipeline

### 3.1 RSS Ingestion & Scheduling
- **Implementation**: [`backend/services/scheduler.py`](file:///Users/rahul/blog-aggregator/backend/services/scheduler.py) & [`backend/services/rss_service.py`](file:///Users/rahul/blog-aggregator/backend/services/rss_service.py)
- Uses `APScheduler` with an `AsyncIOScheduler` running in the FastAPI lifespan.
- Runs every 15 minutes (configurable via `RSS_UPDATE_INTERVAL_MINUTES`).
- Evaluates 25+ tech feeds across categories:
  - `rumors`: MacRumors Leaks, Android Authority Leaks, Wccftech Leaks
  - `smartphones`: The Verge, 9to5Mac, 9to5Google, Android Police, GSMArena, XDA
  - `laptops`: Ars Technica, TechCrunch
  - `ai`: MIT Technology Review, MarkTechPost, VentureBeat
  - `gaming`: IGN, Polygon, GameSpot
  - `gadgets`: Gadgets 360, CNET, Engadget

### 3.2 Web Scraper & HTML Sanitization
- **Implementation**: [`backend/services/scraper_service.py`](file:///Users/rahul/blog-aggregator/backend/services/scraper_service.py)
- Fetches full HTML using `httpx.AsyncClient` with realistic desktop browser headers.
- Employs `readability.Document` to isolate the core article container from navigation bars, ads, and footers.
- Uses `BeautifulSoup` to parse clean paragraphs, subheadings, and extract high-resolution inline images and captions while stripping tracking scripts.

### 3.3 Leaker & Tipster Entity Recognition
- **Implementation**: [`backend/services/scraper_service.py`](file:///Users/rahul/blog-aggregator/backend/services/scraper_service.py) (`LEAKERS_REGISTRY`)
- Recognizes citations of prominent industry analysts and supply chain tipsters:
  - **Ming-Chi Kuo** (TF International Securities — 92% Accuracy Index)
  - **Mark Gurman** (Bloomberg Power On — 90% Accuracy Index)
  - **Ice Universe** (Samsung & Display Leaks — 88% Accuracy Index)
  - **Digital Chat Station** (Weibo Supply Chain Tipster — 89% Accuracy Index)
  - **Ross Young** (DSCC Display Analyst — 94% Accuracy Index)
  - **OnLeaks (Steve Hemmerstoffer)** (CAD Renders — 95% Accuracy Index)
- Automatically classifies matching stories under the `rumors` category and attaches leaker metadata and credibility scores.

### 3.4 AI Editorial Synthesis Engine
- **Implementation**: [`backend/services/ai_service.py`](file:///Users/rahul/blog-aggregator/backend/services/ai_service.py)
- **Dual Engine Architecture**:
  1. **Cloud LLM Mode**: Uses Groq API (`llama-3.3-70b-versatile`) or OpenAI-compatible endpoints when `AI_API_KEY` is set.
  2. **High-Speed Local Technical Synthesizer**: A deterministic heuristic engine that extracts hardware specifications, generates multi-point Executive Takeaways, and structures raw text into deep Markdown sections without needing API tokens.
- **Output Artifacts**:
  - **Executive Takeaways**: 3–5 bullet points covering Core Developments, Technical Significance, and Ecosystem Ramifications.
  - **Hardware Specifications Matrix**: Parses Display, Processor (SoC), RAM, Internal Storage, Camera optics, Battery, and Pricing.
  - **Structured Markdown Body**:
    - `## 📌 In-Depth Overview & Context`
    - `## 🔬 Deep Technical & Architecture Analysis`
    - `## 🛠️ Hardware Specifications & Feature Matrix`
    - `## 🕵️‍♂️ Upstream Supply Chain & Leaker Intelligence`
    - `## ⚖️ Ecosystem Impact & Future Outlook`

### 3.5 On-Demand Enrichment Lifecycle
- When a user opens any article via `GET /api/articles/{article_id}`, [`ensure_article_enriched`](file:///Users/rahul/blog-aggregator/backend/services/rss_service.py) checks if full content exists.
- If an article only has a raw RSS snippet, the backend scrapes and synthesizes the full editorial story **in real-time**, updates MongoDB, and delivers the full report to the reader.

---

## 4. Database & Data Models

### MongoDB Configuration
- **Driver**: `motor.motor_asyncio.AsyncIOMotorClient`
- **Database**: `tech_news_aggregator`
- **Collections**:
  - `articles`: Holds all processed and synthesized tech stories.
  - `sources`: Tracks feed URLs, categories, health stats, and fetch timestamps.

### Article Schema ([`backend/models/article.py`](file:///Users/rahul/blog-aggregator/backend/models/article.py))
```python
class ArticleBase(BaseModel):
    title: str
    url: HttpUrl
    source: str
    source_logo: Optional[HttpUrl] = None
    author: Optional[str] = None
    summary: Optional[str] = None
    ai_summary: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[HttpUrl] = None
    images: List[str] = []
    category: CategoryEnum
    tags: List[str] = []
    key_takeaways: List[str] = []
    is_rumor: bool = False
    leaker_name: Optional[str] = None
    confidence_score: Optional[int] = None
    specs: Optional[Dict[str, Any]] = None
    reading_time_minutes: int = 3
    ai_enhanced: bool = False
    published_at: datetime
    fetched_at: datetime
    views: int = 0
    trending_score: float = 0.0
```

---

## 5. Frontend Architecture & Minimalist Design System

### 5.1 In-App Reading Experience (Zero Redirects)
- All cards, grid items, and trending feeds route to `/article/:id` using React Router.
- Built [`frontend/src/pages/ArticlePage.tsx`](file:///Users/rahul/blog-aggregator/frontend/src/pages/ArticlePage.tsx):
  - **Breadcrumbs & Monospace Kicker**: `HOME / SMARTPHONES / LEAK RADAR`
  - **Executive Takeaways Box**: Highlighted bullet points at the top of the article.
  - **Hardware Specs Sheet**: Multi-column technical specifications matrix.
  - **Interactive Action Bar**:
    - 🔊 **Listen Story**: Native Web Speech Synthesis audio narrator.
    - 🔤 **Text Sizing**: `A`, `A+`, `A++` dynamic text scaling.
    - 🔖 **Bookmark**: Instant interactive toggle.
    - 🔗 **Social Share**: One-click sharing to X (Twitter), WhatsApp, and clipboard link copy.
  - **Related Stories Grid**: Categorized internal recommendations at the bottom.

### 5.2 Minimalist Design Language
- **Palette**: Deep Obsidian neutral (`#090a0f`), dark slate cards (`#11131a`), and crisp white primary text (`#f4f4f6`).
- **Hairline Borders**: `border-white/[0.08]` providing subtle structural definition without visual clutter.
- **Pill Navigation**: Minimalist capsule tabs with active indicators.

### 5.3 State Management & RTK Query
- **Implementation**: [`frontend/src/store/api/newsApi.ts`](file:///Users/rahul/blog-aggregator/frontend/src/store/api/newsApi.ts)
- Endpoints cached and managed via Redux Toolkit Query:
  - `getArticles`: Supports pagination (`page`, `page_size`), `category`, `search`, and `is_rumor`.
  - `getArticleById`: Fetches single article with automated view counter increments.
  - `getTrendingArticles`: Fetches top articles sorted by `trending_score`.
  - `getCategories`: Aggregates active counts per category.

---

## 6. Step-by-Step Build & Setup Instructions

### Prerequisites
- **Python**: 3.11+
- **Node.js**: 18+
- **MongoDB**: Local MongoDB community service or MongoDB Atlas cluster

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

### 3. Environment Variables

**Backend (`backend/.env`)**:
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=tech_news_aggregator
RSS_UPDATE_INTERVAL_MINUTES=15
USE_AI_SUMMARY=false
AI_API_KEY=your_groq_api_key_here
AI_MODEL=llama-3.3-70b-versatile
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 7. Directory Structure & Sitemap

```
blog-aggregator/
├── backend/
│   ├── main.py                  # FastAPI entry point & lifespan scheduler
│   ├── config.py                # Environment configuration & settings
│   ├── database.py              # MongoDB async connection & index manager
│   ├── models/
│   │   ├── article.py           # Pydantic article schemas & CategoryEnum
│   │   └── source.py            # Source metadata schema
│   ├── routes/
│   │   ├── articles.py          # /api/articles, /trending, /{id}, /custom-leak
│   │   ├── categories.py        # /api/categories
│   │   └── sources.py           # /api/sources
│   ├── services/
│   │   ├── rss_service.py       # RSS parser & on-demand enrichment
│   │   ├── scraper_service.py   # Full HTML scraper & leaker recognition
│   │   ├── ai_service.py        # AI editorial synthesis & specs extractor
│   │   └── scheduler.py         # APScheduler background worker
│   ├── data/
│   │   └── sources.py           # 25+ tech sources & leaker feed URLs
│   └── utils/
│       └── formatters.py        # Time-ago & date helper formatters
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── article/
│   │   │   │   ├── ArticleCard.tsx      # Minimalist article card (all variants)
│   │   │   │   ├── TrendingSection.tsx  # Trending radar list component
│   │   │   │   └── CategoryBadge.tsx    # Category & leak badges
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx           # Minimalist capsule nav & search
│   │   │   │   └── Footer.tsx           # Clean footer & attribution
│   │   │   └── ui/
│   │   │       ├── CategoryFilter.tsx   # Sidebar category section filter
│   │   │       └── Skeletons.tsx        # Loading skeleton loaders
│   │   ├── pages/
│   │   │   ├── HomePage.tsx             # Lead story, topic chips & feed
│   │   │   ├── ArticlePage.tsx          # Full in-app reader, specs & audio
│   │   │   ├── TrendingPage.tsx         # Trending tech stories
│   │   │   ├── SearchPage.tsx           # Full-text search
│   │   │   └── CategoriesPage.tsx       # Category grid
│   │   ├── store/
│   │   │   ├── api/newsApi.ts           # RTK Query API slice
│   │   │   └── slices/uiSlice.ts        # UI theme & modal state
│   │   ├── lib/
│   │   │   └── utils.ts                 # Styling & category color utilities
│   │   ├── types.ts                     # TypeScript data interfaces
│   │   ├── index.css                    # Minimalist design tokens & typography
│   │   └── App.tsx                      # React Router structure
│   ├── tailwind.config.js               # Dark mode color palette
│   └── package.json
│
├── BUILD_AND_ARCHITECTURE_GUIDE.md      # Full architecture & build guide
├── README.md                            # Project overview & quick start
└── docker-compose.yml                   # Docker multi-container orchestrator
```
