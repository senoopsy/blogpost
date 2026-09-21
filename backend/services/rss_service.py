import feedparser
import httpx
import asyncio
import re
from datetime import datetime, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.article import Article, ArticleCreate, ArticleBase, CategoryEnum
from models.source import Source, SourceCreate
from data.sources import TECH_SOURCES, get_source_objects
from utils.formatters import format_time_ago
from services.scraper_service import scrape_full_article, detect_leakers
from services.ai_service import generate_heuristic_article, enrich_article_with_ai
from services.classifier_service import clean_html_text, clean_summary, classify_article_category

# Category display names
CATEGORY_DISPLAY_NAMES = {
    "rumors": "🔥 Leaks & Rumors",
    "smartphones": "Smartphones",
    "laptops": "Laptops",
    "ai": "AI & ML",
    "gaming": "Gaming",
    "wearables": "Wearables",
    "apps": "Apps",
    "startups": "Startups",
    "gadgets": "Gadgets",
    "general": "General"
}

async def fetch_feed(rss_url: str, source_name: str, source_category: CategoryEnum = CategoryEnum.GENERAL) -> list:
    """Fetch and parse an RSS feed with Senoopsy AI editorial synthesis & dynamic categorization"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(rss_url)
            if response.status_code != 200:
                print(f"Failed to fetch {source_name}: Status {response.status_code}")
                return []

        # Parse RSS feed
        parsed = feedparser.parse(response.text)

        articles = []
        for entry in parsed.entries:
            try:
                # Parse publication date
                published = None
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    published = datetime(*entry.published_parsed[:7])
                    published = published.replace(tzinfo=timezone.utc) if published.tzinfo is None else published

                if published is None and hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                    published = datetime(*entry.updated_parsed[:7])
                    published = published.replace(tzinfo=timezone.utc) if published.tzinfo is None else published

                if published is None:
                    published = datetime.utcnow()

                # Extract and clean raw summary
                raw_summary = getattr(entry, 'summary', '')
                if not raw_summary and hasattr(entry, 'description'):
                    raw_summary = entry.description
                if not raw_summary:
                    raw_summary = getattr(entry, 'title', '')

                # Extract image from summary or enclosures
                image_url = None
                images = []
                if hasattr(entry, 'content'):
                    for content_entry in entry.content:
                        if hasattr(content_entry, 'value'):
                            img_matches = re.findall(r'src=["\']([^"\']+?)["\']', content_entry.value)
                            for match in img_matches:
                                if match.startswith('http') and not any(junk in match.lower() for junk in ['logo', 'icon', 'pixel', 'avatar', '1x1']):
                                    images.append(match)
                            if images:
                                image_url = images[0]
                            break

                if not image_url and hasattr(entry, 'enclosures'):
                    for enc in entry.enclosures:
                        if 'image' in getattr(enc, 'type', ''):
                            image_url = enc.href
                            images.append(enc.href)
                            break

                if not image_url and hasattr(entry, 'media_content'):
                    for media in entry.media_content:
                        if media.get('url'):
                            image_url = media['url']
                            images.append(media['url'])
                            break

                # Extract tags
                tags = []
                if hasattr(entry, 'tags'):
                    for tag in entry.tags:
                        if 'term' in tag:
                            tags.append(tag.term)

                raw_title = entry.title if hasattr(entry, 'title') else ''
                entry_url = entry.link if hasattr(entry, 'link') else ''
                
                # Clean text thoroughly
                clean_title_str = clean_html_text(raw_title)
                clean_sum_str = clean_summary(raw_summary, max_chars=400)
                
                # Check for leakers
                leaker_info = detect_leakers(clean_title_str + " " + clean_sum_str)
                
                # Dynamic content-based classification
                detected_cat = classify_article_category(
                    title=clean_title_str,
                    summary=clean_sum_str,
                    tags=tags,
                    source=source_name
                )
                
                effective_category = "rumors" if leaker_info else detected_cat

                # Generate editorial synthesis with clean sentences
                ai_data = generate_heuristic_article(
                    title=clean_title_str,
                    raw_text=clean_sum_str,
                    source=source_name,
                    category=effective_category,
                    leaker_info=leaker_info
                )

                article_data = {
                    "title": clean_title_str,
                    "url": entry_url,
                    "source": source_name,
                    "author": getattr(entry, 'author', None),
                    "summary": clean_sum_str,
                    "ai_summary": ai_data.get("executive_summary"),
                    "content": ai_data.get("content_markdown"),
                    "image_url": image_url,
                    "images": images[:5],
                    "category": effective_category,
                    "tags": tags,
                    "key_takeaways": ai_data.get("key_takeaways", []),
                    "is_rumor": ai_data.get("is_rumor", False),
                    "leaker_name": ai_data.get("leaker_name"),
                    "confidence_score": ai_data.get("confidence_score"),
                    "specs": ai_data.get("specs"),
                    "reading_time_minutes": ai_data.get("reading_time_minutes", 3),
                    "ai_enhanced": True,
                    "published_at": published,
                }

                articles.append(ArticleCreate(**article_data))

            except Exception as e:
                print(f"Error parsing entry from {source_name}: {e}")
                continue

        return articles

    except Exception as e:
        print(f"Error fetching RSS feed from {source_name}: {e}")
        return []


async def save_articles(db: AsyncIOMotorDatabase, articles: list, source_name: str):
    """Save articles to MongoDB, avoiding duplicates"""
    if not articles:
        return 0

    articles_collection = db["articles"]
    sources_collection = db["sources"]

    saved_count = 0

    for article_data in articles:
        try:
            # Check if article already exists by URL
            existing = await articles_collection.find_one({"url": str(article_data.url)})
            if existing:
                continue  # Skip duplicate

            # Create article with proper defaults
            now = datetime.utcnow()
            article_dict = article_data.model_dump(by_alias=True, exclude=["id"])
            article_dict["url"] = str(article_data.url)
            if article_dict.get("source_logo"):
                article_dict["source_logo"] = str(article_dict["source_logo"])
            if article_dict.get("image_url"):
                article_dict["image_url"] = str(article_dict["image_url"])
            if isinstance(article_dict.get("category"), CategoryEnum):
                article_dict["category"] = article_dict["category"].value
            article_dict["fetched_at"] = now

            # Insert article
            await articles_collection.insert_one(article_dict)

            # Update source's last_fetched and increment count
            await sources_collection.update_one(
                {"name": source_name},
                {
                    "$set": {"last_fetched": now},
                    "$inc": {"fetch_count": 1}
                },
                upsert=True
            )

            saved_count += 1

        except Exception as e:
            print(f"Error saving article from {source_name}: {e}")
            continue

    return saved_count


async def ensure_article_enriched(db: AsyncIOMotorDatabase, article_doc: dict) -> dict:
    """
    On-demand scraper & AI transformer for Senoopsy.
    If full content is short, boilerplate, or missing,
    scrapes full webpage HTML and generates full editorial article in real-time.
    """
    content = article_doc.get("content", "")
    key_takeaways = article_doc.get("key_takeaways", [])
    
    # If already fully enriched with long scraped content, return
    if content and len(content) > 1200 and key_takeaways and len(key_takeaways) >= 3 and not "<div" in str(article_doc.get("summary", "")):
        return article_doc

    article_id = article_doc.get("_id")
    url = article_doc.get("url", "")
    source = article_doc.get("source", "Senoopsy")
    category = article_doc.get("category", "general")
    title = clean_html_text(article_doc.get("title", ""))

    try:
        # 1. Scrape full content from original URL
        scraped = await scrape_full_article(url)
        full_text = scraped.get("full_text", "")
        if not full_text or len(full_text) < 100:
            full_text = article_doc.get("summary", "") or title

        full_text = clean_html_text(full_text)

        # 2. Extract images
        existing_images = article_doc.get("images", [])
        scraped_images = scraped.get("images", [])
        all_images = list(dict.fromkeys(existing_images + scraped_images))
        hero_image = article_doc.get("image_url") or (all_images[0] if all_images else None)

        # 3. Dynamic category check
        clean_summary_text = clean_summary(full_text[:600], max_chars=400)
        leaker_info = scraped.get("leaker_info") or detect_leakers(title + " " + full_text)
        
        detected_category = classify_article_category(
            title=title,
            summary=clean_summary_text,
            content=full_text,
            tags=article_doc.get("tags", []),
            source=source
        )
        final_category = "rumors" if leaker_info else detected_category

        # 4. AI synthesis & enhancement
        ai_data = await enrich_article_with_ai(
            title=title,
            raw_text=full_text,
            source=source,
            category=final_category,
            leaker_info=leaker_info
        )

        update_fields = {
            "title": title,
            "summary": clean_summary_text,
            "category": final_category,
            "content": ai_data.get("content_markdown"),
            "ai_summary": ai_data.get("executive_summary"),
            "key_takeaways": ai_data.get("key_takeaways", []),
            "specs": ai_data.get("specs"),
            "reading_time_minutes": ai_data.get("reading_time_minutes", 3),
            "is_rumor": ai_data.get("is_rumor", False) or (final_category == "rumors"),
            "leaker_name": ai_data.get("leaker_name"),
            "confidence_score": ai_data.get("confidence_score"),
            "ai_enhanced": True,
            "images": all_images[:6],
        }
        if hero_image:
            update_fields["image_url"] = hero_image

        # Update database in background
        if article_id:
            await db["articles"].update_one(
                {"_id": ObjectId(article_id) if isinstance(article_id, str) else article_id},
                {"$set": update_fields}
            )

        # Merge for response
        article_doc.update(update_fields)
        return article_doc

    except Exception as e:
        print(f"Error in ensure_article_enriched: {e}")
        return article_doc


async def fetch_and_store_all(db: AsyncIOMotorDatabase):
    """Fetch all RSS feeds and store new articles"""
    sources_collection = db["sources"]

    total_saved = 0

    # Ensure all sources are in the database
    existing_source_names = await sources_collection.find({}).to_list(None)
    existing_names = {s["name"] for s in existing_source_names}

    for source_data in TECH_SOURCES:
        source_name = source_data["name"]
        rss_url = source_data["rss_url"]
        category = source_data["category"]

        if source_name not in existing_names:
            new_source = SourceCreate(
                name=source_name,
                url=source_data["url"],
                rss_url=rss_url,
                category=category,
                logo_url=source_data.get("logo_url"),
                description=source_data.get("description"),
                language=source_data.get("language", "en"),
                country=source_data.get("country", "US")
            )
            source_dict = new_source.model_dump(by_alias=True, exclude=["id"])
            for key, value in source_dict.items():
                if hasattr(value, '__class__') and 'HttpUrl' in value.__class__.__name__:
                    source_dict[key] = str(value)
            if isinstance(source_dict.get("category"), CategoryEnum):
                source_dict["category"] = source_dict["category"].value
            await sources_collection.insert_one(source_dict)

        articles = await fetch_feed(rss_url, source_name, category)
        saved = await save_articles(db, articles, source_name)
        total_saved += saved
        if saved > 0:
            print(f"Fetched {len(articles)} from {source_name}, saved {saved} new")

    return total_saved


async def get_articles(
    db: AsyncIOMotorDatabase,
    page: int = 1,
    page_size: int = 20,
    category: str = None,
    search: str = None,
    is_rumor: bool = None
) -> dict:
    """Get articles with pagination, filtering, and rich editorial metadata"""
    articles_collection = db["articles"]

    query = {}

    if category and category != 'all':
        try:
            cat_enum = CategoryEnum(category)
            query["category"] = cat_enum.value
        except ValueError:
            query["category"] = category

    if is_rumor is not None:
        query["is_rumor"] = is_rumor

    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"summary": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
            {"leaker_name": {"$regex": search, "$options": "i"}}
        ]

    total = await articles_collection.count_documents(query)
    skip = (page - 1) * page_size

    cursor = articles_collection.find(query).sort("published_at", -1).skip(skip).limit(page_size)
    articles = await cursor.to_list(length=page_size)

    formatted_articles = []
    for art in articles:
        published_str = art.get("published_at")
        fetched_str = art.get("fetched_at")

        if isinstance(published_str, datetime):
            published_str = published_str.isoformat()
        if isinstance(fetched_str, datetime):
            fetched_str = fetched_str.isoformat()

        time_ago = format_time_ago(art.get("published_at", datetime.utcnow()))
        cat_key = art.get("category", "general")
        cat_display = CATEGORY_DISPLAY_NAMES.get(cat_key, cat_key.title())

        # Clean title & summary
        clean_t = clean_html_text(art.get("title", ""))
        clean_s = clean_summary(art.get("summary", ""), max_chars=350)

        formatted_articles.append({
            "id": str(art.get("_id", "")),
            "title": clean_t,
            "url": art.get("url", ""),
            "source": art.get("source", ""),
            "source_logo": art.get("source_logo"),
            "author": art.get("author"),
            "summary": clean_s,
            "ai_summary": art.get("ai_summary"),
            "content": art.get("content"),
            "image_url": art.get("image_url"),
            "images": art.get("images", []),
            "category": cat_key,
            "category_display": cat_display,
            "tags": art.get("tags", []),
            "key_takeaways": art.get("key_takeaways", []),
            "is_rumor": art.get("is_rumor", False) or (cat_key == "rumors"),
            "leaker_name": art.get("leaker_name"),
            "confidence_score": art.get("confidence_score"),
            "specs": art.get("specs"),
            "reading_time_minutes": art.get("reading_time_minutes", 3),
            "ai_enhanced": art.get("ai_enhanced", False),
            "published_at": published_str,
            "fetched_at": fetched_str,
            "views": art.get("views", 0),
            "trending_score": art.get("trending_score", 0.0),
            "time_ago": time_ago
        })

    has_more = (skip + len(formatted_articles)) < total

    return {
        "articles": formatted_articles,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": has_more
    }


async def get_categories(db: AsyncIOMotorDatabase) -> list:
    """Get all available categories with counts"""
    articles_collection = db["articles"]

    pipeline = [
        {"$group": {
            "_id": "$category",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}}
    ]

    results = await articles_collection.aggregate(pipeline).to_list(length=None)

    categories = []
    for result in results:
        cat_id = result["_id"]
        if not cat_id:
            continue
        count = result["count"]
        categories.append({
            "value": cat_id,
            "label": CATEGORY_DISPLAY_NAMES.get(cat_id, cat_id.title()),
            "count": count
        })

    return categories