from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routers and services
from routes import articles, categories, sources
from services.scheduler import start_rss_scheduler, stop_rss_scheduler
from database import connect_to_mongo, close_mongo_connection
from config import get_cors_origins

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up...")
    try:
        print("Connecting to MongoDB...")
        await connect_to_mongo()
        print("MongoDB connected!")

        print("Starting RSS scheduler...")
        # Don't wait for RSS fetch on startup - just start the scheduler
        asyncio.create_task(start_rss_scheduler())
        print("Scheduler started!")
    except Exception as e:
        print(f"Startup error: {e}")

    yield

    # Shutdown
    print("Shutting down...")
    await stop_rss_scheduler()
    await close_mongo_connection()
    print("Shutdown complete!")

# Initialize FastAPI app
app = FastAPI(
    title="Tech News Aggregator API",
    description="Automated tech news aggregation from RSS feeds",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(articles.router, prefix="/api/articles", tags=["articles"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(sources.router, prefix="/api/sources", tags=["sources"])

@app.get("/")
async def root():
    return {"message": "Tech News Aggregator API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}