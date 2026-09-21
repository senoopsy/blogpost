from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, HttpUrl
from enum import Enum

class CategoryEnum(str, Enum):
    SMARTPHONES = "smartphones"
    LAPTOPS = "laptops"
    AI = "ai"
    GAMING = "gaming"
    WEARABLES = "wearables"
    APPS = "apps"
    STARTUPS = "startups"
    GADGETS = "gadgets"
    RUMORS = "rumors"
    GENERAL = "general"

class ArticleBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    url: HttpUrl
    source: str
    source_logo: Optional[HttpUrl] = None
    author: Optional[str] = None
    summary: Optional[str] = None
    ai_summary: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[HttpUrl] = None
    images: List[str] = []
    category: CategoryEnum = CategoryEnum.GENERAL
    tags: List[str] = []
    key_takeaways: List[str] = []
    is_rumor: bool = False
    leaker_name: Optional[str] = None
    confidence_score: Optional[int] = None
    specs: Optional[Dict[str, Any]] = None
    reading_time_minutes: int = 3
    ai_enhanced: bool = False
    published_at: datetime
    fetched_at: datetime = Field(default_factory=datetime.utcnow)
    views: int = 0
    trending_score: float = 0.0

class ArticleCreate(ArticleBase):
    pass

class Article(ArticleBase):
    id: str = Field(alias="_id")
    time_ago: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ArticleResponse(BaseModel):
    id: str
    title: str
    url: str
    source: str
    source_logo: Optional[str] = None
    author: Optional[str] = None
    summary: Optional[str] = None
    ai_summary: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    images: List[str] = []
    category: str
    category_display: Optional[str] = None
    tags: List[str] = []
    key_takeaways: List[str] = []
    is_rumor: bool = False
    leaker_name: Optional[str] = None
    confidence_score: Optional[int] = None
    specs: Optional[Dict[str, Any]] = None
    reading_time_minutes: int = 3
    ai_enhanced: bool = False
    published_at: str
    fetched_at: str
    views: int = 0
    trending_score: float = 0.0
    time_ago: Optional[str] = None

class ArticleListResponse(BaseModel):
    articles: List[ArticleResponse]
    total: int
    page: int
    page_size: int
    has_more: bool