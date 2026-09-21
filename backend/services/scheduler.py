from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from database import get_database
from services.rss_service import fetch_and_store_all
from config import settings
import logging

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = None

async def start_rss_scheduler():
    """Start the RSS feed scheduler"""
    global scheduler

    if scheduler is not None:
        logger.warning("RSS scheduler is already running")
        return

    scheduler = AsyncIOScheduler()

    # Add job to fetch RSS feeds every N minutes
    scheduler.add_job(
        fetch_and_store_all,
        trigger=IntervalTrigger(minutes=settings.RSS_UPDATE_INTERVAL_MINUTES),
        args=[await get_database()],
        id="rss_fetch_job",
        name="Fetch RSS feeds",
        replace_existing=True,
        max_instances=1,
        coalesce=True
    )

    scheduler.start()
    logger.info(f"RSS scheduler started - fetching every {settings.RSS_UPDATE_INTERVAL_MINUTES} minutes")

    # Run initial fetch immediately
    try:
        db = await get_database()
        await fetch_and_store_all(db)
        logger.info("Initial RSS fetch completed")
    except Exception as e:
        logger.error(f"Initial RSS fetch failed: {e}")

async def stop_rss_scheduler():
    """Stop the RSS feed scheduler"""
    global scheduler

    if scheduler is not None:
        scheduler.shutdown(wait=True)
        scheduler = None
        logger.info("RSS scheduler stopped")

async def trigger_manual_fetch():
    """Manually trigger RSS fetch"""
    db = await get_database()
    return await fetch_and_store_all(db)

async def get_scheduler_status():
    """Get scheduler status"""
    if scheduler is None:
        return {"running": False}

    jobs = scheduler.get_jobs()
    return {
        "running": True,
        "jobs": [
            {
                "id": job.id,
                "name": job.name,
                "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None
            }
            for job in jobs
        ]
    }