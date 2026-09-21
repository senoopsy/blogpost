from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from datetime import datetime
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

class SourceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    url: HttpUrl
    rss_url: HttpUrl
    category: CategoryEnum
    logo_url: Optional[HttpUrl] = None
    active: bool = True
    description: Optional[str] = None
    language: str = "en"
    country: str = "US"

class SourceCreate(SourceBase):
    pass

class Source(SourceBase):
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_fetched: Optional[datetime] = None
    fetch_count: int = 0
    error_count: int = 0

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class SourceResponse(BaseModel):
    id: str
    name: str
    url: str
    rss_url: str
    category: str
    logo_url: Optional[str] = None
    active: bool
    description: Optional[str] = None
    language: str
    country: str
    created_at: str
    updated_at: str
    last_fetched: Optional[str] = None
    fetch_count: int
    error_count: int