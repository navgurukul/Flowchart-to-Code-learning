# Notification System Documentation

This document describes the notification system implemented for the Flowchart-to-Code-learning platform.

## Features

### 1. Online User Notifications (Real-time)
When users join the learning platform, other online users receive real-time notifications.

**How it works:**
- Uses Firebase Realtime Database to track user presence
- Listens for new users coming online
- Shows toast notifications to existing users
- Filters out self-notifications and duplicates

**Implementation:**
- `src/services/notificationService.ts` - Core notification service
- Integrated into `src/contexts/AuthContext.tsx` for user lifecycle management
- Uses `react-hot-toast` for UI notifications

### 2. Email Notifications for Inactive Users
Sends email reminders to users who have been inactive on exercises for too long.

**How it works:**
- Tracks user activity and exercise engagement
- Runs background checks every 10 minutes
- Sends emails to users inactive for 30+ minutes on an exercise
- Prevents spam with 2-hour cooldown between notifications

**Implementation:**
- `backend/email_service.py` - Email sending service
- `backend/activity_tracker.py` - User activity tracking
- `backend/scheduler.py` - Background task scheduler
- Integrated into FastAPI app with startup events

## Configuration

### Email Configuration
Create a `.env` file in the `backend` directory:

```env
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password_here
SMTP_FROM_EMAIL=your_email@gmail.com

# Optional: Customize thresholds
INACTIVITY_THRESHOLD_MINUTES=30
CHECK_INTERVAL_MINUTES=10
```

### For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password (not your regular password)
3. Use the App Password as `SMTP_PASSWORD`

### For Other Providers:
- **Outlook/Hotmail**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **Custom SMTP**: Use your provider's settings

## API Endpoints

### Manual Notification Trigger
```http
POST /api/send-inactivity-notifications
Authorization: Bearer <firebase-id-token>
```

Manually trigger inactivity notifications (useful for testing or admin operations).

### Get Inactive Users
```http
GET /api/inactive-users
Authorization: Bearer <firebase-id-token>
```

Get list of currently inactive users for monitoring.

### Update User Activity
```http
POST /api/update-user-activity
Authorization: Bearer <firebase-id-token>
```

Update user's last activity timestamp (called automatically by frontend).

## Firebase Database Structure

### User Presence
```
onlineUsers/
  {uid}/
    uid: string
    displayName: string
    photoURL: string
    currentFlowchartId: string
    currentNodeId: string
    lastSeen: timestamp
    status: "online" | "idle" | "offline"
```

### Email Notification History
```
emailNotifications/
  {uid}/
    lastInactivityEmail: ISO timestamp
    lastInactivityEmailSuccess: boolean
```

### User Progress (existing, enhanced)
```
userProgress/
  {uid}/
    currentExercise: number
    lastAccessedAt: ISO timestamp
    completedExercises: number[]
    totalScore: number
```

## Frontend Integration

### Notification Service
```typescript
import { notificationService } from './services/notificationService';

// Set current user (done automatically in AuthContext)
notificationService.setCurrentUser(userId);

// Manual notifications
notificationService.showUserStartedExerciseNotification(userName, exerciseId);
notificationService.showUserAchievementNotification(userName, achievement);
```

### Activity Tracker
```typescript
import { userActivityTracker } from './services/activityTracker';

// Start tracking (done automatically in AuthContext)
userActivityTracker.startTracking(getIdTokenFunction);

// Check activity status
const minutesInactive = userActivityTracker.getMinutesSinceLastActivity();
const isInactive = userActivityTracker.isInactive(30); // 30 minutes
```

## Testing

Run backend tests:
```bash
cd backend
python simple_test.py
```

Test email configuration:
```bash
cd backend
python -c "from email_service import email_service; print('Email config:', 'OK' if email_service.config else 'Missing')"
```

## Deployment Considerations

### Environment Variables
Set these in your deployment environment:
- `SMTP_SERVER`
- `SMTP_PORT` 
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`

### Background Tasks
The scheduler runs automatically when the FastAPI app starts. For production:
- Consider using a dedicated task queue (Celery, RQ)
- Monitor email sending rates and quotas
- Set up logging and error handling
- Consider using cloud email services (SendGrid, AWS SES)

### Rate Limiting
- Gmail: 500 emails/day for free accounts
- Consider implementing exponential backoff
- Add email queue for high-volume scenarios

## Troubleshooting

### Email Not Sending
1. Check environment variables are set
2. Verify SMTP credentials
3. Check logs for detailed error messages
4. Test with a simple email first

### Notifications Not Appearing
1. Check Firebase connection
2. Verify user authentication
3. Check browser console for errors
4. Ensure Firebase Realtime Database rules allow reads

### Background Tasks Not Running
1. Check FastAPI startup events
2. Verify Firebase Admin SDK initialization
3. Check server logs for scheduler errors

## Security Notes

- Never commit SMTP credentials to version control
- Use App Passwords, not regular passwords
- Consider email rate limiting to prevent abuse
- Validate user permissions for manual notification triggers
- Sanitize user data in email templates