import re
import html
from typing import List, Optional

def clean_html_text(text: Optional[str]) -> str:
    """Strip all HTML tags, decode entities, and normalize whitespace."""
    if not text:
        return ""
    
    # Unescape HTML entities first (&amp; -> &, &#8217; -> ', etc.)
    cleaned = html.unescape(text)
    
    # Remove script and style tags with content
    cleaned = re.sub(r'<script[^>]*>.*?</script>', ' ', cleaned, flags=re.DOTALL | re.IGNORECASE)
    cleaned = re.sub(r'<style[^>]*>.*?</style>', ' ', cleaned, flags=re.DOTALL | re.IGNORECASE)
    
    # Strip all HTML tags
    cleaned = re.sub(r'<[^>]+>', ' ', cleaned)
    
    # Remove common RSS boilerplate trailers
    cleaned = re.sub(r'The post\s+.*?\s+appeared first on\s+.*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'Continue reading\s*(\.\.\.|…)?', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[\s*\.\.\.\s*\]', '', cleaned)
    cleaned = re.sub(r'Read more\s*(\.\.\.|…)?', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\(via\s+[^)]+\)', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'https?://\S+', '', cleaned)  # remove raw URLs in summary text
    
    # Normalize whitespaces
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

def clean_summary(raw_summary: Optional[str], max_chars: int = 350) -> str:
    """
    Produce a clean, coherent summary containing complete sentences without mid-sentence chops.
    """
    cleaned = clean_html_text(raw_summary)
    if not cleaned:
        return ""
    
    if len(cleaned) <= max_chars:
        return cleaned
    
    # Split by sentence boundaries (. ! ?)
    sentences = re.split(r'(?<=[.!?])\s+', cleaned)
    
    result = []
    current_len = 0
    for s in sentences:
        s_clean = s.strip()
        if not s_clean:
            continue
        if current_len + len(s_clean) <= max_chars:
            result.append(s_clean)
            current_len += len(s_clean) + 1
        else:
            break
            
    if result:
        return " ".join(result)
        
    # If even the first sentence is longer than max_chars, cut at the last word boundary and add period
    truncated = cleaned[:max_chars].rsplit(' ', 1)[0].rstrip(' ,;:-')
    if not truncated.endswith(('.', '!', '?')):
        truncated += '.'
    return truncated

def classify_article_category(
    title: str,
    summary: str = "",
    content: str = "",
    tags: Optional[List[str]] = None,
    source: str = ""
) -> str:
    """
    Accurately categorize a tech article based on cleaned title, content, tags, and context.
    """
    clean_title = clean_html_text(title)
    clean_sum = clean_html_text(summary)
    tag_str = " ".join(tags) if tags else ""
    
    full_text = f"{clean_title} {clean_sum} {tag_str}".lower()
    
    # 1. Rumors & Supply Chain Leaks
    if re.search(r'\b(leak|leaks|leaked|leaker|leakers|ming-chi kuo|kuo|gurman|prosser|ice universe|digital chat station|cad render|renders|prototype leak|alleged specs|schematic leak|tipster|insider reports)\b', full_text):
        return "rumors"
        
    # 2. AI & Machine Learning
    if (
        re.search(r'\b(openai|chatgpt|claude|anthropic|gemini|gpt-?4|gpt-?5|deepseek|copilot|llm|llms|generative ai|machine learning|neural network|midjourney|sora|ai model|ai models|ai agent|ai agents|perplexity|mistral|grok|ai tool|ai search|ai safety|ai startup|artificial intelligence|diffusion model|transformer model|q-star|cursor ai|claude code)\b', full_text)
        or re.search(r'\b(ai)\b', clean_title.lower())
    ):
        return "ai"
        
    # 3. Laptops, PCs & Desktops
    if re.search(r'\b(laptop|laptops|macbook|macbook pro|macbook air|thinkpad|dell xps|zenbook|ultrabook|notebook|chromebook|mac mini|mac studio|imac|desktop pc|pc build|intel core ultra|intel core i\d|ryzen 9|ryzen 7|ryzen 5|motherboard|gpu benchmark|rtx 40\d\d|rtx 50\d\d|geforce rtx|radeon rx)\b', full_text):
        return "laptops"
        
    # 4. Smartphones & Mobile Ecosystem
    if re.search(r'\b(iphone|galaxy s\d+|galaxy z|pixel \d+|pixel \d+a|smartphone|smartphones|foldable phone|flip phone|xiaomi \d+|oneplus|snapdragon \d+|dimensity \d+|ios \d+|android \d+|gsmarena|mobile phone|cellular modem|magsafe|5g phone|oxygenos|one ui|hyperos|phone camera)\b', full_text):
        return "smartphones"
        
    # 5. Gaming & Esports (excluding common idioms)
    clean_gaming_text = re.sub(r'game[-\s]changer|the name of the game|endgame', '', full_text)
    if re.search(r'\b(gaming|playstation|ps5|ps4|xbox series|xbox|nintendo|switch 2|steam deck|steam|pokemon|pokémon|gta \w*|grand theft auto|zelda|mario|esports|gamespot|ign|gameplay|gamers?|capcom|bethesda|ubisoft|valve index|rpg|fps game|unreal engine|video games?)\b', clean_gaming_text):
        return "gaming"
        
    # 6. Wearables & Smart Eyewear
    if re.search(r'\b(smartwatch|apple watch|galaxy watch|garmin|fitbit|smart ring|oura|vision pro|meta quest|vr headset|ar glasses|smart glasses|ray-ban meta|airpods|galaxy buds|pixel buds|earbuds|glucose monitor|fitness tracker|headphones|in-ear)\b', full_text):
        return "wearables"
        
    # 7. Gadgets, Networking, Smart Home & Audio
    if re.search(r'\b(router|routers|wi-?fi|wifi|mesh network|smart home|matter standard|zigbee|homekit|smart plug|smart bulb|thermostat|vacuum|roborock|charger|power bank|anker|gan charger|monitors?|keyboard|keyboards|mouse|drone|dji|esp32|raspberry pi|speakers?|sonos|soundbar|oled tv|smart tv|projector|camera body|sony alpha|mirrorless|gadget|gadgets|ifa 202\d)\b', full_text):
        return "gadgets"
        
    # 8. Startups, Venture & Tech Policy/Antitrust
    if re.search(r'\b(startup|startups|funding round|seed round|series a|series b|series c|venture capital|vc firm|valuation|y combinator|techstars|acquisition|acquired for|ipo|layoffs|antitrust trial|doj lawsuit|sec filing)\b', full_text):
        return "startups"
        
    # 9. Apps, Web Browsers & OS Software
    if re.search(r'\b(apps?|application|applications|software|windows 11|macos sequoia|macos|linux distro|ubuntu|chrome browser|firefox|safari browser|whatsapp|telegram|signal messenger|discord|slack|notion|obsidian|vs code|web browser|github repo|apk teardown|beta update)\b', full_text):
        return "apps"
        
    return "general"
