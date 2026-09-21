# Senoopsy - The Journal of Tech Intelligence & Hardware Architecture

An authoritative, automated tech journalism and supply-chain intelligence platform inspired by **The Verge, Gadgets 360, Wired, and AnandTech**.

> 📖 **Full Architecture & Build Process Guide**: See [BUILD_AND_ARCHITECTURE_GUIDE.md](file:///Users/rahul/blog-aggregator/BUILD_AND_ARCHITECTURE_GUIDE.md) for the complete end-to-end technical guide.

## Features

- 🔒 **Zero External Redirects** - Read complete articles 100% inside Senoopsy with original source link access
- ⚡ **AI Editorial Synthesis Engine** - Transforms raw text into multi-section journalism with **Executive Takeaways**
- 🛠️ **Hardware Specifications Matrix** - Automatically extracts and formats display, SoC, camera, and battery specs
- 🕵️‍♂️ **Leakers & Supply Chain Radar** - Tracks Ming-Chi Kuo, Ice Universe, Ross Young, and Mark Gurman with accuracy ratings
- 🔊 **Text-to-Speech Narrator** - Listen to synthesized audio summaries in-app
- 📰 **Bespoke Editorial Typography** - Authentic Newsreader serif headlines, Plus Jakarta Sans body, and JetBrains Mono metrics
- 🔍 **Dynamic Category Classification** - Content-based classifier across 10 categories (Smartphones, AI, Gaming, Gadgets, Laptops, etc.)

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS v3.4 (dark mode glassmorphism)
- RTK Query (state management & API)
- React Router v6
- Lucide React (icons)
- clsx + tailwind-merge (utilities)

### Backend
- Python 3.11+
- FastAPI
- Motor (async MongoDB driver)
- APScheduler (RSS fetch scheduling)
- feedparser (RSS parsing)

### Database
- MongoDB 7

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
cd blog-aggregator

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Manual Setup

#### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB (local or Atlas)

#### Backend Setup

```bash
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URL

# Run the server
uvicorn main:app --reload --port 8000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

## Configuration

### Environment Variables

#### Backend (.env)
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=tech_news_aggregator
RSS_UPDATE_INTERVAL_MINUTES=15
USE_AI_SUMMARY=false
AI_API_KEY=your_api_key_here
AI_MODEL=llama3-8b-8192
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### Frontend
```env
VITE_API_URL=http://localhost:8000
```

## RSS Feed Sources

The aggregator fetches from these sources:

| Source | Category |
|--------|----------|
| The Verge | General |
| 9to5Mac | Smartphones |
| 9to5Google | Smartphones |
| Android Police | Smartphones |
| GSMArena | Smartphones |
| XDA Developers | Smartphones |
| SamMobile | Smartphones |
| Ars Technica | Laptops |
| TechCrunch | Laptops |
| MIT Technology Review | AI |
| MarkTechPost | AI |
| VentureBeat | AI |
| IGN | Gaming |
| Polygon | Gaming |
| GameSpot | Gaming |
| Wareable | Wearables |
| Gadgets 360 | Gadgets |
| CNET | Gadgets |
| Engadget | Gadgets |
| Wired | General |
| BBC Technology | General |
| Reuters Technology | General |

## Project Structure

```
blog-aggregator/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── database.py          # MongoDB connection
│   ├── models/              # Pydantic models
│   ├── routes/              # API endpoints
│   ├── services/            # Business logic
│   ├── data/                # Source configurations
│   └── utils/              # Utilities
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Redux store & RTK Query
│   │   ├── lib/             # Utilities
│   │   └── types.ts         # TypeScript types
│   ├── tailwind.config.js   # Tailwind configuration
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/articles/` | GET | Get articles (pagination, filter) |
| `/api/articles/trending` | GET | Get trending articles |
| `/api/articles/{id}` | GET | Get article by ID |
| `/api/categories/` | GET | Get all categories |
| `/api/sources/` | GET | Get all sources |
| `/health` | GET | Health check |

## Deployment

### Vercel (Frontend)

```bash
cd frontend
vercel
```

Set environment variable `VITE_API_URL` to your backend URL.

### Railway (Backend)

1. Connect your GitHub repository
2. Set environment variables
3. Railway auto-detects FastAPI

### MongoDB Atlas (Database)

Create a free cluster and update `MONGODB_URL` in backend.

## License

MIT License - feel free to use this project for learning and development.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with ❤️ for tech enthusiasts
