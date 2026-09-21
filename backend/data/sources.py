from models.source import SourceCreate, Source
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

# Predefined tech news sources with RSS feeds
TECH_SOURCES = [
    # Leakers & Tech Rumors
    {
        "name": "MacRumors Leaks & Rumors",
        "url": "https://www.macrumors.com",
        "rss_url": "https://feeds.macrumors.com/MacRumors-All",
        "category": "rumors",
        "logo_url": "https://images.macrumors.com/images-new/macrumors-logo-dark.svg",
        "description": "Apple leaks, Ming-Chi Kuo reports, and supply chain rumors",
        "language": "en",
        "country": "US"
    },
    {
        "name": "Android Authority Leaks",
        "url": "https://www.androidauthority.com",
        "rss_url": "https://www.androidauthority.com/feed/",
        "category": "rumors",
        "logo_url": "https://www.androidauthority.com/wp-content/themes/aa/dist/img/logo.svg",
        "description": "Android exclusives, APK teardowns, and smartphone leaks",
        "language": "en",
        "country": "US"
    },
    {
        "name": "Wccftech Tech Leaks",
        "url": "https://wccftech.com",
        "rss_url": "https://feed.wccftech.com/",
        "category": "rumors",
        "logo_url": "https://cdn.wccftech.com/wp-content/themes/wccftech-theme/assets/images/wccftech_logo.svg",
        "description": "Hardware leaks, GPU benchmarks, and processor rumors",
        "language": "en",
        "country": "US"
    },
    # Smartphones & Mobile
    {
        "name": "The Verge",
        "url": "https://www.theverge.com",
        "rss_url": "https://www.theverge.com/rss/index.xml",
        "category": "smartphones",
        "logo_url": "https://cdn.vox-cdn.com/uploads/chorus_asset/file/23539233/logo_verge_black_1024.png",
        "description": "Technology news and reviews",
        "language": "en",
        "country": "US"
    },
    {
        "name": "9to5Mac",
        "url": "https://9to5mac.com",
        "rss_url": "https://9to5mac.com/feed/",
        "category": "smartphones",
        "logo_url": "https://9to5mac.com/wp-content/uploads/sites/6/2014/02/9to5mac_logo_new.png",
        "description": "Apple news and rumors",
        "language": "en",
        "country": "US"
    },
    {
        "name": "9to5Google",
        "url": "https://9to5google.com",
        "rss_url": "https://9to5google.com/feed/",
        "category": "smartphones",
        "logo_url": "https://9to5google.com/wp-content/uploads/sites/4/2016/07/9to5google-logo.png",
        "description": "Google news and Android updates",
        "language": "en",
        "country": "US"
    },
    {
        "name": "Android Police",
        "url": "https://www.androidpolice.com",
        "rss_url": "https://www.androidpolice.com/feed/",
        "category": "smartphones",
        "logo_url": "https://cdn.androidpolice.com/wp-content/uploads/2019/05/Android-Police-Logo.png",
        "description": "Android news, reviews, and apps",
        "language": "en",
        "country": "US"
    },
    {
        "name": "GSMArena",
        "url": "https://www.gsmarena.com",
        "rss_url": "https://www.gsmarena.com/rss/news-feed.php",
        "category": "smartphones",
        "logo_url": "https://www.gsmarena.com/img/logo.png",
        "description": "Mobile phone news and reviews",
        "language": "en",
        "country": "US"
    },
    {
        "name": "XDA Developers",
        "url": "https://www.xda-developers.com",
        "rss_url": "https://www.xda-developers.com/feed/",
        "category": "smartphones",
        "logo_url": "https://www.xda-developers.com/files/2019/05/xda-developers-logo.png",
        "description": "Android development and news",
        "language": "en",
        "country": "US"
    },
    {
        "name": "SamMobile",
        "url": "https://www.sammobile.com",
        "rss_url": "https://www.sammobile.com/feed/",
        "category": "smartphones",
        "logo_url": "https://www.sammobile.com/wp-content/uploads/2015/07/SamMobile_logo.png",
        "description": "Samsung news and updates",
        "language": "en",
        "country": "US"
    },

    # Laptops & Computing
    {
        "name": "Ars Technica",
        "url": "https://arstechnica.com",
        "rss_url": "http://feeds.arstechnica.com/arstechnica/index/",
        "category": "laptops",
        "logo_url": "https://cdn.arstechnica.net/wp-content/current/assets/logo-2x.png",
        "description": "Technology news and analysis",
        "language": "en",
        "country": "US"
    },
    {
        "name": "The Verge - Tech",
        "url": "https://www.theverge.com/tech",
        "rss_url": "https://www.theverge.com/tech/rss/index.xml",
        "category": "laptops",
        "logo_url": "https://cdn.vox-cdn.com/uploads/chorus_asset/file/23539233/logo_verge_black_1024.png",
        "description": "Technology section of The Verge",
        "language": "en",
        "country": "US"
    },
    {
        "name": "TechCrunch",
        "url": "https://techcrunch.com",
        "rss_url": "https://techcrunch.com/feed/",
        "category": "laptops",
        "logo_url": "https://i0.wp.com/techcrunch.com/wp-content/uploads/2015/03/cropped-techcrunch-logo.png?fit=192%2C192&ssl=1",
        "description": "Startup and technology news",
        "language": "en",
        "country": "US"
    },

    # AI & Machine Learning
    {
        "name": "MIT Technology Review - AI",
        "url": "https://www.technologyreview.com/topic/artificial-intelligence/",
        "rss_url": "https://www.technologyreview.com/topic/artificial-intelligence/feed/",
        "category": "ai",
        "logo_url": "https://www.technologyreview.com/wp-content/uploads/2017/06/MITTR-logo.svg",
        "description": "Artificial intelligence news",
        "language": "en",
        "country": "US"
    },
    {
        "name": "MarkTechPost",
        "url": "https://www.marktechpost.com",
        "rss_url": "https://www.marktechpost.com/feed/",
        "category": "ai",
        "logo_url": "https://www.marktechpost.com/wp-content/uploads/2021/02/marktechpost-logo.png",
        "description": "AI research and machine learning news",
        "language": "en",
        "country": "US"
    },
    {
        "name": "VentureBeat - AI",
        "url": "https://venturebeat.com/category/ai/",
        "rss_url": "https://venturebeat.com/ai/feed/",
        "category": "ai",
        "logo_url": "https://venturebeat.com/wp-content/uploads/2015/07/VentureBeat_logo.png",
        "description": "AI industry news",
        "language": "en",
        "country": "US"
    },

    # Gaming
    {
        "name": "IGN",
        "url": "https://www.ign.com",
        "rss_url": "http://feeds.ign.com/ign/all",
        "category": "gaming",
        "logo_url": "https://assets.ign.com/sites/igniv2/imgs/ign-com/logos/Logo_PNG.png",
        "description": "Gaming news, reviews, and videos",
        "language": "en",
        "country": "US"
    },
    {
        "name": "Polygon",
        "url": "https://www.polygon.com",
        "rss_url": "https://www.polygon.com/rss/index.xml",
        "category": "gaming",
        "logo_url": "https://cdn.vox-cdn.com/uploads/chorus_asset/file/23679805/polygon-logo.png",
        "description": "Gaming news and culture",
        "language": "en",
        "country": "US"
    },
    {
        "name": "GameSpot",
        "url": "https://www.gamespot.com",
        "rss_url": "https://www.gamespot.com/feeds/news/",
        "category": "gaming",
        "logo_url": "https://static.gamespot.com/uploads/scale_super/1590/15906863/4296165-logo.png",
        "description": "Gaming news and reviews",
        "language": "en",
        "country": "US"
    },

    # Wearables
    {
        "name": "Wareable",
        "url": "https://www.wareable.com",
        "rss_url": "https://www.wareable.com/rss",
        "category": "wearables",
        "logo_url": "https://www.wareable.com/wp-content/uploads/2018/03/wareable-logo.png",
        "description": "Wearable technology news",
        "language": "en",
        "country": "US"
    },
    {
        "name": "9to5Mac - Wearables",
        "url": "https://9to5mac.com/tag/wearables/",
        "rss_url": "https://9to5mac.com/tag/wearables/feed/",
        "category": "wearables",
        "logo_url": "https://9to5mac.com/wp-content/uploads/sites/6/2014/02/9to5mac_logo_new.png",
        "description": "Apple wearable news",
        "language": "en",
        "country": "US"
    },

    # Apps & Software
    {
        "name": "TechCrunch - Apps",
        "url": "https://techcrunch.com/tag/apps/",
        "rss_url": "https://techcrunch.com/tag/apps/feed/",
        "category": "apps",
        "logo_url": "https://i0.wp.com/techcrunch.com/wp-content/uploads/2015/03/cropped-techcrunch-logo.png?fit=192%2C192&ssl=1",
        "description": "Mobile and web app news",
        "language": "en",
        "country": "US"
    },
    {
        "name": "The Next Web",
        "url": "https://thenextweb.com",
        "rss_url": "https://thenextweb.com/feed/",
        "category": "apps",
        "logo_url": "https://cdn0.tnwcdn.com/wp-content/themes/bloxtnw5/assets/images/tnw-logo.svg",
        "description": "Technology news and analysis",
        "language": "en",
        "country": "NL"
    },

    # Startups
    {
        "name": "TechCrunch - Startups",
        "url": "https://techcrunch.com/category/startups/",
        "rss_url": "https://techcrunch.com/category/startups/feed/",
        "category": "startups",
        "logo_url": "https://i0.wp.com/techcrunch.com/wp-content/uploads/2015/03/cropped-techcrunch-logo.png?fit=192%2C192&ssl=1",
        "description": "Startup funding and news",
        "language": "en",
        "country": "US"
    },
    {
        "name": "Entrepreneur",
        "url": "https://www.entrepreneur.com",
        "rss_url": "https://www.entrepreneur.com/latest.rss",
        "category": "startups",
        "logo_url": "https://assets.entrepreneur.com/content/3x2/2000/20210415164259-entrepreneur-logo.svg",
        "description": "Entrepreneurship and small business news",
        "language": "en",
        "country": "US"
    },

    # Gadgets
    {
        "name": "Gadgets 360",
        "url": "https://gadgets.ndtv.com",
        "rss_url": "https://gadgets.ndtv.com/rss/news",
        "category": "gadgets",
        "logo_url": "https://i.gadgets360cdn.com/large/gadgets_360_logo_1587726239632.png",
        "description": "Latest gadgets and technology news",
        "language": "en",
        "country": "IN"
    },
    {
        "name": "CNET",
        "url": "https://www.cnet.com",
        "rss_url": "https://www.cnet.com/rss/all/",
        "category": "gadgets",
        "logo_url": "https://www.cnet.com/a/img/resize/ffe3e8d55bc5b969bbf812bd438ebb5e5273c4ae/hub/2021/11/08/54d0a8f2-9753-417c-927e-b76499320d8d/cnet-logo-2021.png?fit=crop&auto=webp&width=1200&height=630",
        "description": "Technology product reviews and news",
        "language": "en",
        "country": "US"
    },
    {
        "name": "Engadget",
        "url": "https://www.engadget.com",
        "rss_url": "https://www.engadget.com/rss.xml",
        "category": "gadgets",
        "logo_url": "https://www.engadget.com/wp-content/themes/engadget/assets/images/logo.svg",
        "description": "Technology news and reviews",
        "language": "en",
        "country": "US"
    },

    # General Technology
    {
        "name": "Wired",
        "url": "https://www.wired.com",
        "rss_url": "https://www.wired.com/feed/rss",
        "category": "general",
        "logo_url": "https://www.wired.com/wp-content/themes/Phoenix/assets/images/logo.svg",
        "description": "How technology is changing the world",
        "language": "en",
        "country": "US"
    },
    {
        "name": "BBC Technology",
        "url": "https://www.bbc.com/news/technology",
        "rss_url": "http://feeds.bbci.co.uk/news/technology/rss.xml",
        "category": "general",
        "logo_url": "https://news.bbcimg.co.uk/nol/shared/img/bbc_news_logo_pixelated.gif",
        "description": "BBC technology news",
        "language": "en",
        "country": "GB"
    },
    {
        "name": "Reuters Technology",
        "url": "https://www.reuters.com/technology/",
        "rss_url": "http://feeds.reuters.com/reuters/technologyNews",
        "category": "general",
        "logo_url": "https://www.reuters.com/resizer/v2/trk65jz5yqejdeh6f4dymft4via/assets/v1/images/reuters-logo.png",
        "description": "Global technology news",
        "language": "en",
        "country": "US"
    }
]

def get_source_objects() -> list[SourceCreate]:
    """Convert source dictionaries to SourceCreate objects"""
    sources = []
    for source_dict in TECH_SOURCES:
        # Convert category string to enum
        source_dict['category'] = CategoryEnum(source_dict['category'])
        sources.append(SourceCreate(**source_dict))
    return sources