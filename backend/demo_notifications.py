# backend/demo_notifications.py
"""
Demo script to test the notification system functionality
Run this script to see how the email notifications work
"""

import asyncio
import os
from datetime import datetime, timezone, timedelta
from email_service import EmailNotificationService, UserActivity

async def demo_email_notifications():
    """Demo the email notification system"""
    print("🚀 Demo: Email Notification System")
    print("=" * 50)
    
    # Check if email is configured
    service = EmailNotificationService()
    if not service.config:
        print("❌ Email not configured. Please set up environment variables:")
        print("   SMTP_SERVER, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL")
        print("\nFor testing, you can see the email content that would be sent:")
        print("-" * 50)
        
        # Show demo email content
        demo_user = UserActivity(
            uid="demo123",
            email="demo@example.com",
            display_name="Demo User",
            current_exercise_id=7,
            last_active=datetime.now(timezone.utc) - timedelta(minutes=45),
            exercise_start_time=None
        )
        
        email_content = service._create_inactivity_email(demo_user, 45)
        print("📧 Demo Email Content (HTML):")
        print(email_content[:500] + "..." if len(email_content) > 500 else email_content)
        return
    
    print("✅ Email configuration found!")
    print(f"📤 SMTP Server: {service.config.smtp_server}")
    print(f"📧 From Email: {service.config.from_email}")
    
    # Demo: Create a test user
    test_user = UserActivity(
        uid="test_user_123",
        email=input("\n📧 Enter your email for demo (or press Enter to skip): ").strip(),
        display_name="Test User",
        current_exercise_id=5,
        last_active=datetime.now(timezone.utc) - timedelta(minutes=35),
        exercise_start_time=None
    )
    
    if not test_user.email:
        print("⏭️  Skipping email send demo")
        return
    
    print(f"\n🧪 Demo: Sending inactivity email to {test_user.email}")
    print("📝 Email content preview:")
    
    # Show email preview
    email_content = service._create_inactivity_email(test_user, 35)
    print(f"Subject: 🎯 Don't Give Up! Continue Your Learning Journey")
    print(f"To: {test_user.email}")
    print("Content: HTML email with motivational message...")
    
    # Ask for confirmation
    confirm = input("\n❓ Send this demo email? (y/N): ").strip().lower()
    if confirm in ['y', 'yes']:
        try:
            success = await service.send_inactivity_notification(test_user, 35)
            if success:
                print("✅ Demo email sent successfully!")
            else:
                print("❌ Failed to send demo email")
        except Exception as e:
            print(f"❌ Error sending demo email: {e}")
    else:
        print("⏭️  Demo email cancelled")

def demo_online_notifications():
    """Demo the online notification system concepts"""
    print("\n🌐 Demo: Online User Notification System")
    print("=" * 50)
    
    print("📱 How it works:")
    print("1. User A logs into the platform")
    print("2. Firebase Realtime Database updates with user presence")
    print("3. User B (already online) receives a notification:")
    print("   '👋 Sarah just joined the learning session! 🎉'")
    print("\n🔄 Real-time updates:")
    print("- Uses Firebase onValue listeners")
    print("- Filters out self-notifications")
    print("- Shows toast notifications with react-hot-toast")
    print("- Tracks user's current exercise progress")
    
    print("\n📊 Firebase Database Structure:")
    print("""
onlineUsers/
  user123/
    uid: "user123"
    displayName: "Sarah"
    status: "online"
    currentFlowchartId: "exercise-5"
    lastSeen: 1642781234000
    """)

def demo_activity_tracking():
    """Demo the activity tracking system"""
    print("\n⏱️  Demo: User Activity Tracking")
    print("=" * 50)
    
    print("🎯 Frontend Activity Detection:")
    print("- Monitors: clicks, keypress, scroll, mousemove")
    print("- Updates backend every 5 minutes")
    print("- Resets inactivity timer on user interactions")
    
    print("\n🔍 Backend Activity Monitoring:")
    print("- Checks user progress every 10 minutes")
    print("- Identifies users inactive for 30+ minutes")
    print("- Sends motivational emails with exercise tips")
    print("- Prevents spam with 2-hour cooldown")
    
    print("\n📈 Inactivity Detection Logic:")
    print("1. User starts Exercise 5 at 2:00 PM")
    print("2. Last activity recorded at 2:05 PM")
    print("3. Background check at 2:40 PM finds 35min inactivity") 
    print("4. Email sent: 'Don't give up on Exercise 5!'")
    print("5. Cooldown prevents another email until 4:40 PM")

async def main():
    """Run the complete demo"""
    print("🎓 Flowchart-to-Code Learning: Notification System Demo")
    print("=" * 60)
    
    # Demo online notifications (conceptual)
    demo_online_notifications()
    
    # Demo activity tracking (conceptual) 
    demo_activity_tracking()
    
    # Demo email notifications (functional if configured)
    await demo_email_notifications()
    
    print("\n🎉 Demo Complete!")
    print("\n📚 For full setup instructions, see: NOTIFICATION_SYSTEM.md")
    print("🚀 Ready to enhance your learning platform with notifications!")

if __name__ == "__main__":
    asyncio.run(main())