from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from database import get_database
from bson import ObjectId
from datetime import datetime
from models.source import SourceResponse, SourceCreate
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[SourceResponse])
async def get_sources(
    active_only: bool = True,
    db = Depends(get_database)
):
    """Get all sources"""
    sources_collection = db["sources"]

    query = {"active": True} if active_only else {}

    sources = await sources_collection.find(query).to_list(None)

    formatted_sources = []
    for source in sources:
        formatted_sources.append({
            "id": str(source.get("_id")),
            "name": source.get("name", ""),
            "url": source.get("url", ""),
            "rss_url": source.get("rss_url", ""),
            "category": source.get("category", ""),
            "logo_url": source.get("logo_url"),
            "active": source.get("active", False),
            "description": source.get("description"),
            "language": source.get("language", "en"),
            "country": source.get("country", "US"),
            "created_at": source.get("created_at").isoformat() if isinstance(source.get("created_at"), datetime) else str(source.get("created_at")),
            "updated_at": source.get("updated_at").isoformat() if isinstance(source.get("updated_at"), datetime) else str(source.get("updated_at")),
            "last_fetched": source.get("last_fetched").isoformat() if isinstance(source.get("last_fetched"), datetime) else str(source.get("last_fetched")),
            "fetch_count": source.get("fetch_count", 0),
            "error_count": source.get("error_count", 0)
        })

    return formatted_sources

@router.get("/{source_id}", response_model=SourceResponse)
async def get_source_by_id(
    source_id: str,
    db = Depends(get_database)
):
    """Get a single source by ID"""
    sources_collection = db["sources"]

    try:
        source = await sources_collection.find_one({"_id": ObjectId(source_id)})
        if not source:
            raise HTTPException(status_code=404, detail="Source not found")

        return {
            "id": str(source.get("_id")),
            "name": source.get("name", ""),
            "url": source.get("url", ""),
            "rss_url": source.get("rss_url", ""),
            "category": source.get("category", ""),
            "logo_url": source.get("logo_url"),
            "active": source.get("active", False),
            "description": source.get("description"),
            "language": source.get("language", "en"),
            "country": source.get("country", "US"),
            "created_at": source.get("created_at").isoformat() if isinstance(source.get("created_at"), datetime) else str(source.get("created_at")),
            "updated_at": source.get("updated_at").isoformat() if isinstance(source.get("updated_at"), datetime) else str(source.get("updated_at")),
            "last_fetched": source.get("last_fetched").isoformat() if isinstance(source.get("last_fetched"), datetime) else str(source.get("last_fetched")),
            "fetch_count": source.get("fetch_count", 0),
            "error_count": source.get("error_count", 0)
        }
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid source ID")

@router.post("/", response_model=SourceResponse)
async def create_source(
    source: SourceCreate,
    db = Depends(get_database)
):
    """Create a new source"""
    sources_collection = db["sources"]

    # Check if source already exists
    existing = await sources_collection.find_one({"url": str(source.url)})
    if existing:
        raise HTTPException(status_code=400, detail="Source with this URL already exists")

    # Insert source
    source_dict = source.model_dump(by_alias=True, exclude=["id"])
    now = datetime.utcnow()
    source_dict["created_at"] = now
    source_dict["updated_at"] = now

    result = await sources_collection.insert_one(source_dict)

    # Get created source
    created_source = await sources_collection.find_one({"_id": result.inserted_id})

    return {
        "id": str(created_source.get("_id")),
        "name": created_source.get("name", ""),
        "url": created_source.get("url", ""),
        "rss_url": created_source.get("rss_url", ""),
        "category": created_source.get("category", ""),
        "logo_url": created_source.get("logo_url"),
        "active": created_source.get("active", False),
        "description": created_source.get("description"),
        "language": created_source.get("language", "en"),
        "country": created_source.get("country", "US"),
        "created_at": created_source.get("created_at").isoformat() if isinstance(created_source.get("created_at"), datetime) else str(created_source.get("created_at")),
        "updated_at": created_source.get("updated_at").isoformat() if isinstance(created_source.get("updated_at"), datetime) else str(created_source.get("updated_at")),
        "last_fetched": created_source.get("last_fetched").isoformat() if isinstance(created_source.get("last_fetched"), datetime) else str(created_source.get("last_fetched")),
        "fetch_count": created_source.get("fetch_count", 0),
        "error_count": created_source.get("error_count", 0)
    }

@router.put("/{source_id}/toggle")
async def toggle_source(
    source_id: str,
    db = Depends(get_database)
):
    """Toggle source active status"""
    sources_collection = db["sources"]

    try:
        source = await sources_collection.find_one({"_id": ObjectId(source_id)})
        if not source:
            raise HTTPException(status_code=404, detail="Source not found")

        new_active = not source.get("active", False)

        await sources_collection.update_one(
            {"_id": ObjectId(source_id)},
            {
                "$set": {
                    "active": new_active,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        return {"success": True, "active": new_active}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid source ID")

@router.delete("/{source_id}")
async def delete_source(
    source_id: str,
    db = Depends(get_database)
):
    """Delete a source"""
    sources_collection = db["sources"]

    try:
        result = await sources_collection.delete_one({"_id": ObjectId(source_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Source not found")

        return {"success": True, "message": "Source deleted successfully"}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid source ID")