# backend/test_email_notifications.py
import pytest
import asyncio
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timezone, timedelta
from email_service import EmailNotificationService, UserActivity
from activity_tracker import UserActivityTracker

def test_email_config_loading():
    """Test email configuration loading"""
    with patch.dict('os.environ', {
        'SMTP_SERVER': 'smtp.test.com',
        'SMTP_PORT': '587',
        'SMTP_USERNAME': 'test@test.com',
        'SMTP_PASSWORD': 'testpass',
        'SMTP_FROM_EMAIL': 'noreply@test.com'
    }):
        service = EmailNotificationService()
        assert service.config is not None
        assert service.config.smtp_server == 'smtp.test.com'
        assert service.config.smtp_port == 587
        assert service.config.username == 'test@test.com'

def test_email_config_incomplete():
    """Test email configuration with missing values"""
    with patch.dict('os.environ', {}, clear=True):
        service = EmailNotificationService()
        assert service.config is None

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
    
    assert "Test User" in html_content
    assert "Exercise 5" in html_content
    assert "45 minutes" in html_content
    assert "Don't Give Up" in html_content
    assert "flowchart-to-code-learning.vercel.app" in html_content

@pytest.mark.asyncio
async def test_send_email_without_config():
    """Test sending email without configuration"""
    service = EmailNotificationService()
    service.config = None
    
    result = await service.send_email("test@example.com", "Test", "<p>Test</p>")
    assert result is False

def test_user_activity_tracker_init():
    """Test UserActivityTracker initialization"""
    tracker = UserActivityTracker()
    assert tracker.inactivity_threshold_minutes == 30
    assert tracker.check_interval_minutes == 10

@pytest.mark.asyncio
@patch('firebase_admin.db.reference')
async def test_get_inactive_users_empty(mock_db_ref):
    """Test getting inactive users when none exist"""
    # Mock Firebase database responses
    mock_ref = Mock()
    mock_ref.get.return_value = {}
    mock_db_ref.return_value = mock_ref
    
    tracker = UserActivityTracker()
    inactive_users = tracker.get_inactive_users()
    
    assert len(inactive_users) == 0

@pytest.mark.asyncio
@patch('firebase_admin.db.reference')
@patch('firebase_admin.auth.get_user')
async def test_get_inactive_users_with_data(mock_get_user, mock_db_ref):
    """Test getting inactive users with test data"""
    # Mock user data
    current_time = datetime.now(timezone.utc)
    inactive_time = current_time - timedelta(minutes=45)
    
    progress_data = {
        'user123': {
            'currentExercise': 5,
            'lastAccessedAt': inactive_time.isoformat()
        }
    }
    
    # Mock Firebase database responses
    def mock_ref_side_effect(path):
        mock_ref = Mock()
        if 'userProgress' in path:
            mock_ref.get.return_value = progress_data
        else:
            mock_ref.get.return_value = {}
        return mock_ref
    
    mock_db_ref.side_effect = mock_ref_side_effect
    
    # Mock Firebase Auth
    mock_user_record = Mock()
    mock_user_record.email = 'test@example.com'
    mock_user_record.display_name = 'Test User'
    mock_get_user.return_value = mock_user_record
    
    tracker = UserActivityTracker()
    inactive_users = tracker.get_inactive_users()
    
    assert len(inactive_users) == 1
    assert inactive_users[0].uid == 'user123'
    assert inactive_users[0].email == 'test@example.com'
    assert inactive_users[0].current_exercise_id == 5

if __name__ == "__main__":
    # Run basic tests without pytest
    print("Running basic email notification tests...")
    
    test_email_config_incomplete()
    print("✓ Email config incomplete test passed")
    
    test_inactivity_email_content()
    print("✓ Email content generation test passed")
    
    test_user_activity_tracker_init()
    print("✓ UserActivityTracker init test passed")
    
    print("All basic tests passed!")