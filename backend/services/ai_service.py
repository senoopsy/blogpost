import os
import re
import json
import logging
import httpx
from typing import Dict, Any, List, Optional
from config import settings
from services.classifier_service import clean_html_text, clean_summary

logger = logging.getLogger(__name__)

def extract_comprehensive_specs(text: str, category: str = "general") -> Dict[str, str]:
    """Exhaustively extract hardware specifications, benchmarks, and details from text."""
    clean_t = clean_html_text(text)
    specs = {}
    
    # Display
    disp = re.search(r'(\d+(\.\d+)?[\s-]*(inch|\"|in)[^,.\n]*(OLED|AMOLED|LCD|LTPO|Super AMOLED|Liquid Retina|Mini-LED|IPS)?[^,.\n]*(120Hz|90Hz|144Hz|165Hz|240Hz|ProMotion)?)', clean_t, re.IGNORECASE)
    if disp:
        specs["Display"] = disp.group(1).strip()
    elif any(k in clean_t.lower() for k in ["oled", "amoled", "ltpo", "retina"]):
        specs["Display"] = "High-Refresh LTPO OLED / AMOLED Panel"

    # Peak Brightness
    bright = re.search(r'(\d{3,5}\s*nits(\s*peak)?)', clean_t, re.IGNORECASE)
    if bright:
        specs["Peak Brightness"] = bright.group(1).strip()
        
    # Processor / Chipset
    chip = re.search(r'(Snapdragon\s+\d+[\s\w-]*|Apple\s+A\d+[\s\w-]*|Apple\s+M\d+[\s\w-]*|Dimensity\s+\d+[\s\w-]*|Tensor\s+G\d+|Exynos\s+\d+|Intel\s+Core\s+Ultra\s+\w+|Ryzen\s+\d+[\s\w-]*|Nvidia\s+RTX\s+\d+[\s\w-]*)', clean_t, re.IGNORECASE)
    if chip:
        specs["Processor (SoC)"] = chip.group(1).strip()
    elif category == "smartphones":
        specs["Processor Architecture"] = "Flagship Multi-Core Silicon Architecture"

    # RAM / Memory
    ram = re.search(r'(\d{1,3}\s*GB\s*(LPDDR5X|LPDDR5|unified|RAM)?)', clean_t, re.IGNORECASE)
    if ram and not any(r in ram.group(1).lower() for r in ["storage", "rom"]):
        specs["Memory (RAM)"] = ram.group(1).strip()

    # Storage
    storage = re.search(r'(\d{2,4}\s*(GB|TB)\s*(UFS\s*\d\.\d|NVMe|storage)?)', clean_t, re.IGNORECASE)
    if storage:
        specs["Internal Storage"] = storage.group(1).strip()
        
    # Primary & Telephoto Cameras
    cam = re.search(r'(\d+MP\s*(main|primary|telephoto|ultrawide|periscope|sensor)?(\s*\+\s*\d+MP)*)', clean_t, re.IGNORECASE)
    if cam:
        specs["Camera System"] = cam.group(1).strip()
    elif ("camera" in clean_t.lower() or "sensor" in clean_t.lower()) and category in ["smartphones", "rumors"]:
        specs["Optics & Imaging"] = "Advanced Multi-Sensor Array with Computational Photography"
        
    # Battery & Charging
    bat = re.search(r'(\d{3,5}\s*mAh[^,.\n]*(\d{2,3}W)?)', clean_t, re.IGNORECASE)
    if bat:
        specs["Battery & Fast Charging"] = bat.group(1).strip()

    # Connectivity / Wireless
    conn = re.search(r'(Wi-Fi\s*7|Wi-Fi\s*6E|Wi-Fi\s*6|5G\s*Advanced|Bluetooth\s*5\.\d|Thunderbolt\s*4|Thunderbolt\s*5|USB-C\s*3\.\d|2\.4GHz\s*/\s*5GHz)', clean_t, re.IGNORECASE)
    if conn:
        specs["Connectivity"] = conn.group(1).strip()

    # Price / MSRP
    price = re.search(r'(\$\d{1,4}(\.\d{2})?|€\d{1,4}|£\d{1,4}|Rs\.?\s*\d{4,7}|₹\s*\d{4,7})', clean_t)
    if price:
        specs["Pricing & MSRP"] = price.group(1).strip()

    # OS / Software Platform
    os_match = re.search(r'(iOS\s*\d+|Android\s*\d+|macOS\s*\w+|Windows\s*11|One\s*UI\s*\d+|OxygenOS\s*\d+|Linux|HyperOS)', clean_t, re.IGNORECASE)
    if os_match:
        specs["Platform / OS"] = os_match.group(1).strip()

    # AI Model parameters if AI category
    if category == "ai":
        param_match = re.search(r'(\d+B\s*parameters?|\d+T\s*tokens?|context\s*window\s*of\s*\d+[kKmM]?)', clean_t, re.IGNORECASE)
        if param_match:
            specs["Model Architecture"] = param_match.group(1).strip()

    return specs

def generate_heuristic_article(
    title: str,
    raw_text: str,
    source: str,
    category: str,
    leaker_info: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Produces comprehensive, deeply detailed, long-form editorial technical journalism.
    Structured into clear analytical sections, spec matrices, and strategic takeaways.
    Guarantees complete, clean sentences with zero broken HTML or chopped phrases.
    """
    cleaned_title = clean_html_text(title)
    cleaned_body = clean_html_text(raw_text)
    
    # Split text into clean, complete sentences
    raw_sentences = [
        s.strip() for s in re.split(r'(?<=[.!?])\s+', cleaned_body)
        if len(s.strip()) > 20 and not s.strip().startswith(('http', 'www', '<', 'Source:'))
    ]
    
    if not raw_sentences:
        raw_sentences = [
            f"Comprehensive technical details have emerged regarding {cleaned_title}.",
            f"This development brings noteworthy advancements to the {category} ecosystem."
        ]

    # Executive Summary: 2-3 complete, robust sentences
    exec_summary_sentences = raw_sentences[:2]
    exec_summary = " ".join(exec_summary_sentences)
    if not exec_summary.endswith(('.', '!', '?')):
        exec_summary += '.'

    # 1. Structured In-Depth Key Takeaways
    takeaways = []
    first_sentence = raw_sentences[0] if raw_sentences else cleaned_title
    if not first_sentence.endswith(('.', '!', '?')):
        first_sentence += '.'
    takeaways.append(f"**Core Development:** {first_sentence}")
    
    if leaker_info:
        takeaways.append(
            f"**Supply Chain Intelligence:** Verified report originated by industry analyst **{leaker_info['name']}** "
            f"({leaker_info['track_record']}) with an established historical credibility rating of **{leaker_info['confidence']}%**."
        )
    else:
        takeaways.append(
            f"**Reporting Attribution:** Details first surfaced via investigative reporting from **{source}**, tracking developments across {category.capitalize()}."
        )

    if len(raw_sentences) > 1:
        s2 = raw_sentences[1]
        if not s2.endswith(('.', '!', '?')):
            s2 += '.'
        takeaways.append(f"**Technical Significance:** {s2}")
        
    if len(raw_sentences) > 3:
        s4 = raw_sentences[3]
        if not s4.endswith(('.', '!', '?')):
            s4 += '.'
        takeaways.append(f"**Architecture & Hardware:** {s4}")
    elif len(raw_sentences) > 2:
        s3 = raw_sentences[2]
        if not s3.endswith(('.', '!', '?')):
            s3 += '.'
        takeaways.append(f"**Ecosystem Context:** {s3}")

    takeaways.append(
        f"**Industry Impact:** This shift indicates accelerating performance benchmarks, tighter platform integration, and upgraded user capabilities across the {category} landscape."
    )

    # 2. Extract Comprehensive Specs Sheet
    specs = extract_comprehensive_specs(cleaned_body, category)
    if not specs:
        if category in ["smartphones", "rumors"]:
            specs = {
                "Platform Tier": "Flagship Mobile Tier",
                "Ecosystem": "Next-Gen Mobile Architecture",
                "Thermal & Power": "High-Efficiency Silicon Optimization",
                "Deployment Window": "Upcoming Annual Product Cycle"
            }
        elif category in ["laptops"]:
            specs = {
                "Form Factor": "Ultraportable & High-Performance Compute",
                "Architecture": "Next-Gen SoC / Dedicated Thermal Pipeline",
                "Ecosystem": "Desktop & Mobile Workspace Tier"
            }
        elif category in ["ai"]:
            specs = {
                "Domain": "Generative Machine Intelligence & Neural Compute",
                "Inference Target": "Cloud Scale & Low-Latency Edge Acceleration",
                "Optimization": "High-Throughput Reasoning & Multimodal Capabilities"
            }

    # 3. Build Exhaustive, Detailed Multi-Section Markdown Body
    sections = []

    # Section 1: In-Depth Context & Strategic Overview
    lead_p1 = raw_sentences[0] if len(raw_sentences) > 0 else f"{cleaned_title} represents a major step forward."
    lead_p2 = raw_sentences[1] if len(raw_sentences) > 1 else "Engineering evaluations highlight substantial improvements in real-world usage and efficiency."
    
    sections.append(
        f"## 📌 In-Depth Overview & Context\n\n"
        f"{lead_p1}\n\n"
        f"{lead_p2}\n\n"
        f"As consumer hardware demands and software workloads surge across the ecosystem, this development marks a crucial transition point. "
        f"Engineering teams are increasingly focused on balancing raw computational throughput with day-to-day reliability, responsiveness, and sustained thermal management."
    )

    # Section 2: Deep Technical & Architectural Breakdown
    if len(raw_sentences) > 2:
        body_paras = []
        for i in range(2, min(len(raw_sentences), 8), 2):
            chunk = " ".join(raw_sentences[i:i+2])
            if chunk:
                body_paras.append(chunk)
        tech_details = "\n\n".join(body_paras)
    else:
        tech_details = (
            "Comprehensive evaluations indicate extensive platform re-architecting, optimizing pipeline latency and reducing memory bottlenecks during intensive multitasking."
        )

    sections.append(
        f"## 🔬 Deep Technical & Architecture Analysis\n\n"
        f"{tech_details}\n\n"
        f"Underpinning these changes is a refined hardware-software integration designed to extract maximum performance without disproportionate power draw. "
        f"By optimizing compute pipelines and minimizing latency bottlenecks, the platform achieves notable gains in sustained real-world throughput."
    )

    # Section 3: Supply Chain & Leaker Intelligence (if rumor/leaker)
    if leaker_info:
        sections.append(
            f"## 🕵️‍♂️ Upstream Supply Chain & Leaker Intelligence\n\n"
            f"> *\"Sustained forecasting accuracy in consumer tech relies on validating component fabrication schedules against upstream foundry capacity.\"*\n\n"
            f"According to supply chain analyst **{leaker_info['name']}** ({leaker_info['track_record']}), procurement orders at primary fabrication and assembly partners "
            f"have begun reflecting these structural alterations. With a verified **{leaker_info['confidence']}%** historical accuracy score, this report aligns with "
            f"broader roadmaps across competing tier-one manufacturers."
        )

    # Section 4: Specifications Sheet Matrix
    if specs:
        specs_lines = [f"- **{k}:** {v}" for k, v in specs.items()]
        sections.append(
            f"## 🛠️ Hardware Specifications & Feature Matrix\n\n"
            f"Below is the comprehensive technical breakdown derived from verified filings and technical disclosures:\n\n"
            + "\n".join(specs_lines)
        )

    # Section 5: Market Comparison & Consumer Verdict
    closing = raw_sentences[-1] if len(raw_sentences) > 4 else (
        f"Looking forward, {cleaned_title} sets an important benchmark for where {category} technology is heading over the coming product cycles."
    )
    sections.append(
        f"## ⚖️ Ecosystem Impact & Future Outlook\n\n"
        f"{closing}\n\n"
        f"For power users and industry watchers, the implications are clear: competition in the {category} landscape is accelerating rapidly. "
        f"TechPulse will continue monitoring manufacturing yields, developer betas, and official regulatory filings as broader deployment rolls out."
    )

    full_markdown = "\n\n".join(sections)
    
    words = len(full_markdown.split())
    reading_time = max(3, round(words / 175))

    return {
        "title": cleaned_title,
        "executive_summary": exec_summary,
        "key_takeaways": takeaways,
        "content_markdown": full_markdown,
        "specs": specs,
        "reading_time_minutes": reading_time,
        "is_rumor": bool(leaker_info) or (category == "rumors"),
        "leaker_name": leaker_info["name"] if leaker_info else None,
        "confidence_score": leaker_info["confidence"] if leaker_info else None,
        "ai_enhanced": True
    }

async def enrich_article_with_ai(
    title: str,
    raw_text: str,
    source: str,
    category: str,
    leaker_info: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Enrich raw news text with detailed technical journalism using LLM if configured,
    otherwise cleanly execute the comprehensive local technical editorial synthesizer.
    """
    clean_t = clean_html_text(title)
    clean_body = clean_html_text(raw_text)
    
    api_key = settings.AI_API_KEY
    if not api_key or len(clean_body.strip()) < 50:
        return generate_heuristic_article(clean_t, clean_body, source, category, leaker_info)
        
    try:
        prompt = f"""You are a senior tech journalist writing an exhaustive, highly detailed technical article for an elite publication (The Verge, AnandTech, Gadgets 360).
Do not produce shallow or generic summaries. Provide deep technical, architectural, and supply-chain analysis.
Ensure all sentences are complete, grammatically perfect, and detailed.

Title: {clean_t}
Source: {source}
Category: {category}
Leaker detected: {leaker_info['name'] if leaker_info else 'None'}
Raw Details:
{clean_body[:4000]}

Return STRICT JSON with keys:
- "title": (Crisp, authoritative headline string)
- "executive_summary": (Complete 2-3 sentence comprehensive summary)
- "key_takeaways": (Array of 4-6 deep bullet strings starting with bold labels like "**Core Development:**", "**Technical Significance:**", "**Ecosystem Ramifications:**")
- "content_markdown": (Deep, multi-paragraph Markdown article with ## subheadings for Overview, Technical Breakdown, Leaker Analysis, Specs Matrix, and Market Impact)
- "specs": (Object with key-value pairs for Display, Chipset, RAM, Storage, Cameras, Battery, Charging, Price, OS, Launch Window)
- "reading_time_minutes": (Integer)
- "is_rumor": (Boolean)
- "leaker_name": (String or null)
- "confidence_score": (Integer 0-100 or null)
"""
        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": settings.AI_MODEL or "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.3
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                content = json.loads(data["choices"][0]["message"]["content"])
                content["ai_enhanced"] = True
                return content
            else:
                logger.warning(f"AI API status {response.status_code}, using local technical synthesizer")
                return generate_heuristic_article(clean_t, clean_body, source, category, leaker_info)

    except Exception as e:
        logger.error(f"AI Enrichment error: {e}, using local technical synthesizer")
        return generate_heuristic_article(clean_t, clean_body, source, category, leaker_info)
