import asyncio
import re
from motor.motor_asyncio import AsyncIOMotorClient
from services.classifier_service import clean_html_text, clean_summary, classify_article_category
from services.scraper_service import detect_leakers
from services.ai_service import generate_heuristic_article

async def run_migration():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['tech_news_aggregator']
    articles_col = db['articles']
    
    total = await articles_col.count_documents({})
    print(f"Starting migration on {total} articles...")
    
    cursor = articles_col.find({})
    updated_count = 0
    cat_counts = {}
    
    async for doc in cursor:
        doc_id = doc["_id"]
        raw_title = doc.get("title", "")
        raw_summary = doc.get("summary", "")
        raw_content = doc.get("content", "")
        tags = doc.get("tags", [])
        source = doc.get("source", "")
        
        # Clean text
        clean_title = clean_html_text(raw_title)
        clean_sum = clean_summary(raw_summary, max_chars=400)
        
        # Detect leakers & accurate category
        leaker_info = detect_leakers(clean_title + " " + clean_sum)
        detected_category = classify_article_category(
            title=clean_title,
            summary=clean_sum,
            content=raw_content,
            tags=tags,
            source=source
        )
        
        final_category = "rumors" if leaker_info else detected_category
        cat_counts[final_category] = cat_counts.get(final_category, 0) + 1
        
        # Clean takeaways
        takeaways = doc.get("key_takeaways", [])
        cleaned_takeaways = []
        if takeaways:
            for t in takeaways:
                t_clean = clean_html_text(t)
                if len(t_clean) > 15:
                    if not t_clean.endswith(('.', '!', '?')):
                        t_clean += '.'
                    cleaned_takeaways.append(t_clean)
                    
        # If takeaways are missing or too few, regenerate clean heuristic takeaways
        if len(cleaned_takeaways) < 2:
            synth = generate_heuristic_article(
                title=clean_title,
                raw_text=clean_sum or raw_content or clean_title,
                source=source,
                category=final_category,
                leaker_info=leaker_info
            )
            cleaned_takeaways = synth.get("key_takeaways", [])
            if not doc.get("specs"):
                doc["specs"] = synth.get("specs")

        update_fields = {
            "title": clean_title,
            "summary": clean_sum,
            "category": final_category,
            "is_rumor": bool(leaker_info) or (final_category == "rumors"),
            "key_takeaways": cleaned_takeaways,
        }
        
        if leaker_info:
            update_fields["leaker_name"] = leaker_info["name"]
            update_fields["confidence_score"] = leaker_info["confidence"]
            
        await articles_col.update_one({"_id": doc_id}, {"$set": update_fields})
        updated_count += 1
        
    print(f"Migration completed successfully! Cleaned and re-categorized {updated_count} articles.")
    print("New Category Distribution:")
    for cat, cnt in sorted(cat_counts.items(), key=lambda x: -x[1]):
        print(f"  - {cat}: {cnt}")

if __name__ == "__main__":
    asyncio.run(run_migration())
