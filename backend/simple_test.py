# backend/simple_test.py
import os
from datetime import datetime, timezone, timedelta
from email_service import EmailNotificationService, UserActivity
from activity_tracker import UserActivityTracker

def test_email_config_incomplete():
    """Test email configuration with missing values"""
    # Clear environment variables for this test
    old_env = {}
    email_env_vars = ['SMTP_SERVER', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD', 'SMTP_FROM_EMAIL']
    
    for var in email_env_vars:
        if var in os.environ:
            old_env[var] = os.environ[var]
            del os.environ[var]
    
    try:
        service = EmailNotificationService()
        assert service.config is None, "Config should be None when environment variables are missing"
    finally:
        # Restore environment variables
        for var, value in old_env.items():
            os.environ[var] = value

def test_inactivity_email_content():
    """Test inactivity email content generation"""
    service = EmailNotificationService()
    
    user = UserActivity(
        uid="test123",
        email="test@example.com",
        display_name="Test User",
        current_exercise_id=5,
        last_active=datetime.now(timezone.utc) - timedelta(minutes=45),
        exercise_start_time=None
    )
    
    html_content = service._create_inactivity_email(user, 45)
    
    assert "Test User" in html_content, "User name should be in email content"
    assert "Exercise 5" in html_content, "Exercise ID should be in email content"
    assert "45 minutes" in html_content, "Inactive duration should be in email content"
    assert "Don't Give Up" in html_content, "Motivational message should be in email content"
    assert "flowchart-to-code-learning.vercel.app" in html_content, "Platform URL should be in email content"

def test_user_activity_tracker_init():
    """Test UserActivityTracker initialization"""
    tracker = UserActivityTracker()
    assert tracker.inactivity_threshold_minutes == 30, "Default inactivity threshold should be 30 minutes"
    assert tracker.check_interval_minutes == 10, "Default check interval should be 10 minutes"

def test_email_content_with_no_display_name():
    """Test email content when user has no display name"""
    service = EmailNotificationService()
    
    user = UserActivity(
        uid="test456",
        email="anonymous@example.com",
        display_name=None,
        current_exercise_id=3,
        last_active=datetime.now(timezone.utc) - timedelta(minutes=60),
        exercise_start_time=None
    )
    
    html_content = service._create_inactivity_email(user, 60)
    
    assert "Hi there" in html_content, "Should use 'there' when no display name"
    assert "Exercise 3" in html_content, "Exercise ID should still be shown"

if __name__ == "__main__":
    print("Running email notification tests...")
    
    try:
        test_email_config_incomplete()
        print("✓ Email config incomplete test passed")
        
        test_inactivity_email_content()
        print("✓ Email content generation test passed")
        
        test_user_activity_tracker_init()
        print("✓ UserActivityTracker init test passed")
        
        test_email_content_with_no_display_name()
        print("✓ Email content without display name test passed")
        
        print("\nAll tests passed! 🎉")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()