from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from database import get_database
from services.rss_service import get_articles, get_categories, ensure_article_enriched, CATEGORY_DISPLAY_NAMES
from services.scraper_service import scrape_full_article, detect_leakers
from services.ai_service import enrich_article_with_ai
from utils.formatters import format_time_ago
from models.article import ArticleListResponse, ArticleCreate, CategoryEnum
from pydantic import BaseModel, HttpUrl

router = APIRouter()

class CustomLeakSubmission(BaseModel):
    url: str
    title: Optional[str] = None
    raw_text: Optional[str] = None
    source_name: Optional[str] = "X (Twitter) Leak Intelligence"
    category: Optional[str] = "rumors"
    leaker_name: Optional[str] = None

@router.get("/")
async def get_articles_endpoint(
    page: int = 1,
    page_size: int = 20,
    category: Optional[str] = None,
    search: Optional[str] = None,
    is_rumor: Optional[bool] = None,
    db = Depends(get_database)
):
    """Get articles with pagination, filtering, and rich editorial fields"""
    try:
        page = max(1, page)
        page_size = min(100, max(1, page_size))

        result = await get_articles(
            db,
            page=page,
            page_size=page_size,
            category=category,
            search=search,
            is_rumor=is_rumor
        )
        return result
    except Exception as e:
        print(f"Error in get_articles_endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trending", response_model=List[dict])
async def get_trending_articles(
    limit: int = 10,
    db = Depends(get_database)
):
    """Get trending articles based on trending_score"""
    articles_collection = db["articles"]

    cursor = articles_collection.find().sort("trending_score", -1).limit(limit)
    articles = await cursor.to_list(length=limit)

    formatted_articles = []
    for art in articles:
        published = art.get("published_at")
        fetched = art.get("fetched_at")
        cat_key = art.get("category", "general")

        formatted_articles.append({
            "id": str(art.get("_id")),
            "title": art.get("title", ""),
            "url": art.get("url", ""),
            "source": art.get("source", ""),
            "source_logo": art.get("source_logo"),
            "author": art.get("author"),
            "summary": art.get("summary"),
            "ai_summary": art.get("ai_summary"),
            "content": art.get("content"),
            "image_url": art.get("image_url"),
            "images": art.get("images", []),
            "category": cat_key,
            "category_display": CATEGORY_DISPLAY_NAMES.get(cat_key, cat_key.title()),
            "tags": art.get("tags", []),
            "key_takeaways": art.get("key_takeaways", []),
            "is_rumor": art.get("is_rumor", False) or (cat_key == "rumors"),
            "leaker_name": art.get("leaker_name"),
            "confidence_score": art.get("confidence_score"),
            "specs": art.get("specs"),
            "reading_time_minutes": art.get("reading_time_minutes", 3),
            "ai_enhanced": art.get("ai_enhanced", False),
            "published_at": published.isoformat() if isinstance(published, datetime) else str(published),
            "fetched_at": fetched.isoformat() if isinstance(fetched, datetime) else str(fetched),
            "views": art.get("views", 0),
            "trending_score": art.get("trending_score", 0.0),
            "time_ago": format_time_ago(published)
        })

    return formatted_articles


@router.get("/{article_id}", response_model=dict)
async def get_article_by_id(
    article_id: str,
    db = Depends(get_database)
):
    """Get a single article by ID with automated on-demand scraping & AI enrichment"""
    articles_collection = db["articles"]

    try:
        article = await articles_collection.find_one({"_id": ObjectId(article_id)})
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        # Increment view count
        await articles_collection.update_one(
            {"_id": ObjectId(article_id)},
            {"$inc": {"views": 1}}
        )

        # Ensure article has full rich content, takeaways, and specs synthesized
        article = await ensure_article_enriched(db, article)

        published = article.get("published_at")
        fetched = article.get("fetched_at")
        cat_key = article.get("category", "general")

        return {
            "id": str(article.get("_id")),
            "title": article.get("title", ""),
            "url": article.get("url", ""),
            "source": article.get("source", ""),
            "source_logo": article.get("source_logo"),
            "author": article.get("author"),
            "summary": article.get("summary"),
            "ai_summary": article.get("ai_summary"),
            "content": article.get("content"),
            "image_url": article.get("image_url"),
            "images": article.get("images", []),
            "category": cat_key,
            "category_display": CATEGORY_DISPLAY_NAMES.get(cat_key, cat_key.title()),
            "tags": article.get("tags", []),
            "key_takeaways": article.get("key_takeaways", []),
            "is_rumor": article.get("is_rumor", False) or (cat_key == "rumors"),
            "leaker_name": article.get("leaker_name"),
            "confidence_score": article.get("confidence_score"),
            "specs": article.get("specs"),
            "reading_time_minutes": article.get("reading_time_minutes", 3),
            "ai_enhanced": article.get("ai_enhanced", True),
            "published_at": published.isoformat() if isinstance(published, datetime) else str(published),
            "fetched_at": fetched.isoformat() if isinstance(fetched, datetime) else str(fetched),
            "views": article.get("views", 0) + 1,
            "trending_score": article.get("trending_score", 0.0),
            "time_ago": format_time_ago(published)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_article_by_id: {e}")
        raise HTTPException(status_code=400, detail="Invalid article ID")


@router.post("/custom-leak", response_model=dict)
async def submit_custom_leak(
    payload: CustomLeakSubmission,
    db = Depends(get_database)
):
    """
    Ingest a direct tweet/post/URL from leakers like Ming-Chi Kuo, Ice Universe, etc.
    Scrapes, AI-rewrites, and publishes directly to Senoopsy.
    """
    articles_collection = db["articles"]
    
    url = payload.url.strip()
    # Check if already exists
    existing = await articles_collection.find_one({"url": url})
    if existing:
        return {"id": str(existing["_id"]), "message": "Article already exists in Senoopsy"}

    # Scrape or use raw text
    scraped = await scrape_full_article(url)
    raw_text = payload.raw_text or scraped.get("full_text") or payload.title or url
    title = payload.title or scraped.get("title") or "New Supply Chain Leak Intelligence"
    
    leaker_info = None
    if payload.leaker_name:
        leaker_info = {"name": payload.leaker_name, "track_record": "Independent Tech Tipster", "confidence": 88}
    else:
        leaker_info = scraped.get("leaker_info") or detect_leakers(title + " " + raw_text)

    # AI Synthesis
    ai_data = await enrich_article_with_ai(
        title=title,
        raw_text=raw_text,
        source=payload.source_name,
        category="rumors",
        leaker_info=leaker_info
    )

    hero_image = scraped.get("images", [None])[0] if scraped.get("images") else "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop"

    now = datetime.utcnow()
    doc = {
        "title": ai_data.get("title", title),
        "url": url,
        "source": payload.source_name,
        "author": leaker_info["name"] if leaker_info else "Senoopsy Intelligence",
        "summary": ai_data.get("executive_summary", raw_text[:300]),
        "ai_summary": ai_data.get("executive_summary"),
        "content": ai_data.get("content_markdown"),
        "image_url": hero_image,
        "images": scraped.get("images", []),
        "category": "rumors",
        "tags": ["rumor", "leak", "intel", (leaker_info["name"].lower().replace(' ', '') if leaker_info else "leaker")],
        "key_takeaways": ai_data.get("key_takeaways", []),
        "is_rumor": True,
        "leaker_name": ai_data.get("leaker_name"),
        "confidence_score": ai_data.get("confidence_score", 85),
        "specs": ai_data.get("specs"),
        "reading_time_minutes": ai_data.get("reading_time_minutes", 3),
        "ai_enhanced": True,
        "published_at": now,
        "fetched_at": now,
        "views": 1,
        "trending_score": 15.0
    }

    result = await articles_collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    doc["published_at"] = now.isoformat()
    doc["fetched_at"] = now.isoformat()
    return doc