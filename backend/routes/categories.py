from fastapi import APIRouter, Depends
from typing import List
from database import get_database
from services.rss_service import get_categories
from pydantic import BaseModel

router = APIRouter()


class CategoryResponse(BaseModel):
    value: str
    label: str
    count: int


@router.get("/", response_model=List[CategoryResponse])
async def get_categories_endpoint(
    db = Depends(get_database)
):
    """Get all available categories with article counts"""
    categories = await get_categories(db)
    return categories