# backend/scheduler.py
import asyncio
import logging
from datetime import datetime, timezone
from activity_tracker import activity_tracker

logger = logging.getLogger(__name__)

class NotificationScheduler:
    def __init__(self):
        self.is_running = False
        self.check_interval_minutes = 10  # Check every 10 minutes
        
    async def start_scheduler(self):
        """Start the background scheduler for checking inactive users"""
        if self.is_running:
            logger.warning("Scheduler is already running")
            return
            
        self.is_running = True
        logger.info("Starting notification scheduler...")
        
        while self.is_running:
            try:
                logger.info(f"Running scheduled inactivity check at {datetime.now(timezone.utc)}")
                
                # Run the inactivity notification check
                results = await activity_tracker.send_inactivity_notifications()
                
                if results:
                    successful_count = sum(1 for success in results.values() if success)
                    logger.info(f"Scheduled check completed: {successful_count}/{len(results)} notifications sent")
                else:
                    logger.info("Scheduled check completed: No inactive users found")
                
                # Wait for the next check interval
                await asyncio.sleep(self.check_interval_minutes * 60)  # Convert minutes to seconds
                
            except Exception as e:
                logger.error(f"Error in scheduled notification check: {e}")
                # Continue running even if there's an error
                await asyncio.sleep(60)  # Wait 1 minute before retrying
    
    def stop_scheduler(self):
        """Stop the background scheduler"""
        logger.info("Stopping notification scheduler...")
        self.is_running = False

# Create singleton instance
notification_scheduler = NotificationScheduler()

async def start_background_scheduler():
    """Function to start the scheduler in the background"""
    asyncio.create_task(notification_scheduler.start_scheduler())