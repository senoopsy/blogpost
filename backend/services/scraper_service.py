import httpx
from bs4 import BeautifulSoup
from readability import Document
import re
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
}

# Known tech leakers and tipsters with credibility metrics
LEAKERS_REGISTRY = {
    "ming-chi kuo": {"name": "Ming-Chi Kuo", "track_record": "TF International Securities", "confidence": 92, "category": "apple"},
    "kuo": {"name": "Ming-Chi Kuo", "track_record": "TF International Securities", "confidence": 92, "category": "apple"},
    "ice universe": {"name": "Ice Universe", "track_record": "Samsung & Display Leaks", "confidence": 88, "category": "smartphones"},
    "digital chat station": {"name": "Digital Chat Station", "track_record": "Weibo Supply Chain Tipster", "confidence": 89, "category": "smartphones"},
    "mark gurman": {"name": "Mark Gurman", "track_record": "Bloomberg Power On", "confidence": 90, "category": "apple"},
    "ross young": {"name": "Ross Young", "track_record": "DSCC Display Analyst", "confidence": 94, "category": "smartphones"},
    "yogesh brar": {"name": "Yogesh Brar", "track_record": "Android Specs & Launch Timelines", "confidence": 82, "category": "smartphones"},
    "majin bu": {"name": "Majin Bu", "track_record": "Component & Case Leaks", "confidence": 75, "category": "apple"},
    "sonny dickson": {"name": "Sonny Dickson", "track_record": "Dummy Units & Hardware Molds", "confidence": 85, "category": "apple"},
    "onleaks": {"name": "OnLeaks (Steve Hemmerstoffer)", "track_record": "CAD Renders & Dimensions", "confidence": 95, "category": "smartphones"},
    "billbil-kun": {"name": "billbil-kun", "track_record": "Gaming & Pricing Leaks", "confidence": 96, "category": "gaming"},
    "roland quandt": {"name": "Roland Quandt", "track_record": "WinFuture Specs & Renders", "confidence": 91, "category": "gadgets"},
}

def detect_leakers(text: str) -> Optional[Dict[str, Any]]:
    """Detect if an article references known tech leakers or industry analysts."""
    if not text:
        return None
    
    text_lower = text.lower()
    for key, info in LEAKERS_REGISTRY.items():
        # Match word boundaries for the leaker name/handle
        pattern = r'\b' + re.escape(key) + r'\b'
        if re.search(pattern, text_lower):
            return info
    
    # Generic rumor detector
    rumor_keywords = ["leak", "leaked", "rumor", "rumored", "supply chain", "cad render", "schematic", "insider claims", "analyst report"]
    for keyword in rumor_keywords:
        if keyword in text_lower:
            return {
                "name": "Industry Insider",
                "track_record": "Supply Chain & Tech Rumors",
                "confidence": 78,
                "category": "general"
            }
            
    return None

async def scrape_full_article(url: str) -> Dict[str, Any]:
    """
    Fetch the full HTML of a webpage and extract structured content, images, and metadata.
    """
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=HEADERS) as client:
            response = await client.get(url)
            if response.status_code != 200:
                logger.warning(f"Failed to fetch {url}: Status {response.status_code}")
                return {"success": False, "raw_text": "", "images": []}
            
            html = response.text

        # Extract primary content using readability
        doc = Document(html)
        title = doc.title()
        summary_html = doc.summary(html_partial=True)
        
        soup = BeautifulSoup(summary_html, "html.parser")
        
        # Remove noisy tags
        for tag in soup(["script", "style", "nav", "aside", "footer", "form", "iframe", "button", "noscript"]):
            tag.decompose()

        # Extract images
        images = []
        # First check full HTML meta og:image as primary hero
        full_soup = BeautifulSoup(html, "html.parser")
        og_image = full_soup.find("meta", property="og:image") or full_soup.find("meta", attrs={"name": "twitter:image"})
        if og_image and og_image.get("content"):
            images.append(og_image["content"])

        for img in soup.find_all("img"):
            src = img.get("src") or img.get("data-src") or img.get("data-lazy-src")
            if src and src.startswith("http") and src not in images:
                # Filter out tiny icon-sized images
                if not any(badge in src.lower() for badge in ["logo", "icon", "avatar", "tracking", "1x1", "pixel"]):
                    images.append(src)

        # Extract clean paragraphs
        paragraphs = []
        for p in soup.find_all(["p", "h2", "h3", "li"]):
            text = p.get_text().strip()
            # Filter boilerplate sentences
            if len(text) > 30 and not any(junk in text.lower() for junk in [
                "subscribe to", "newsletter", "follow us on", "read more:", "terms of service", "cookie policy", "all rights reserved"
            ]):
                paragraphs.append(text)

        full_text = "\n\n".join(paragraphs)
        
        # Check for leaker detection
        leaker_info = detect_leakers(title + " " + full_text)

        return {
            "success": True,
            "title": title,
            "full_text": full_text,
            "html_content": str(soup),
            "images": images[:6],
            "leaker_info": leaker_info
        }

    except Exception as e:
        logger.error(f"Scraper error for {url}: {e}")
        return {
            "success": False,
            "full_text": "",
            "images": [],
            "leaker_info": None
        }
