# backend/activity_tracker.py
import firebase_admin
from firebase_admin import db
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
import logging
from email_service import UserActivity, email_service

logger = logging.getLogger(__name__)

class UserActivityTracker:
    def __init__(self):
        self.inactivity_threshold_minutes = 30  # Send notification after 30 minutes of inactivity
        self.check_interval_minutes = 10  # Check for inactive users every 10 minutes
    
    def get_inactive_users(self) -> List[UserActivity]:
        """Get list of users who have been inactive on exercises for too long"""
        try:
            inactive_users = []
            current_time = datetime.now(timezone.utc)
            cutoff_time = current_time - timedelta(minutes=self.inactivity_threshold_minutes)
            
            # Get user progress data
            progress_ref = db.reference('userProgress')
            progress_data = progress_ref.get() or {}
            
            # Get online users data  
            online_ref = db.reference('onlineUsers')
            online_data = online_ref.get() or {}
            
            # Get email notification history to avoid spam
            notification_ref = db.reference('emailNotifications')
            notification_data = notification_ref.get() or {}
            
            for uid, progress in progress_data.items():
                if not progress or not isinstance(progress, dict):
                    continue
                    
                # Check if user has a current exercise
                current_exercise = progress.get('currentExercise')
                if not current_exercise:
                    continue
                
                # Get last active time
                last_accessed = progress.get('lastAccessedAt')
                if not last_accessed:
                    continue
                
                try:
                    # Parse last active time
                    if isinstance(last_accessed, str):
                        last_active_dt = datetime.fromisoformat(last_accessed.replace('Z', '+00:00'))
                    else:
                        # Assume it's a timestamp
                        last_active_dt = datetime.fromtimestamp(last_accessed, tz=timezone.utc)
                    
                    # Check if user has been inactive for too long
                    if last_active_dt > cutoff_time:
                        continue  # User is still active
                    
                    # Check if we've already sent a notification recently (within last 2 hours)
                    user_notifications = notification_data.get(uid, {})
                    last_notification = user_notifications.get('lastInactivityEmail')
                    if last_notification:
                        try:
                            last_notification_dt = datetime.fromisoformat(last_notification.replace('Z', '+00:00'))
                            if current_time - last_notification_dt < timedelta(hours=2):
                                continue  # Don't spam notifications
                        except:
                            pass  # If parsing fails, continue with sending notification
                    
                    # Get user's email from online users or try to get from auth
                    user_email = None
                    display_name = None
                    
                    if uid in online_data:
                        online_user = online_data[uid]
                        # We don't have email in online_data, need to get it from auth
                        display_name = online_user.get('displayName')
                    
                    # Try to get user info from Firebase Auth
                    try:
                        from firebase_admin import auth
                        user_record = auth.get_user(uid)
                        user_email = user_record.email
                        if not display_name:
                            display_name = user_record.display_name
                    except Exception as e:
                        logger.warning(f"Could not get user info for {uid}: {e}")
                        continue
                    
                    if not user_email:
                        continue  # Can't send email without email address
                    
                    # Calculate inactivity duration
                    inactive_minutes = int((current_time - last_active_dt).total_seconds() / 60)
                    
                    inactive_users.append(UserActivity(
                        uid=uid,
                        email=user_email,
                        display_name=display_name,
                        current_exercise_id=current_exercise,
                        last_active=last_active_dt,
                        exercise_start_time=None  # We don't track this separately yet
                    ))
                    
                except Exception as e:
                    logger.error(f"Error processing user {uid}: {e}")
                    continue
            
            logger.info(f"Found {len(inactive_users)} inactive users")
            return inactive_users
            
        except Exception as e:
            logger.error(f"Error getting inactive users: {e}")
            return []
    
    async def send_inactivity_notifications(self) -> Dict[str, bool]:
        """Send email notifications to inactive users"""
        inactive_users = self.get_inactive_users()
        
        if not inactive_users:
            logger.info("No inactive users found")
            return {}
        
        # Send email notifications
        results = await email_service.send_bulk_inactivity_notifications(
            inactive_users, 
            self.inactivity_threshold_minutes
        )
        
        # Record notification history
        current_time = datetime.now(timezone.utc).isoformat()
        notification_ref = db.reference('emailNotifications')
        
        for uid, success in results.items():
            if success:
                try:
                    notification_ref.child(uid).update({
                        'lastInactivityEmail': current_time,
                        'lastInactivityEmailSuccess': True
                    })
                except Exception as e:
                    logger.error(f"Error recording notification for {uid}: {e}")
        
        successful_count = sum(1 for success in results.values() if success)
        logger.info(f"Sent {successful_count}/{len(results)} inactivity notifications successfully")
        
        return results
    
    def update_user_activity(self, uid: str, exercise_id: Optional[int] = None) -> None:
        """Update user's last activity time"""
        try:
            progress_ref = db.reference(f'userProgress/{uid}')
            update_data = {
                'lastAccessedAt': datetime.now(timezone.utc).isoformat()
            }
            
            if exercise_id is not None:
                update_data['currentExercise'] = exercise_id
            
            progress_ref.update(update_data)
            
        except Exception as e:
            logger.error(f"Error updating user activity for {uid}: {e}")

# Create singleton instance
activity_tracker = UserActivityTracker()