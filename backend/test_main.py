from fastapi.testclient import TestClient
from unittest.mock import patch
import firebase_admin # Import the base module to mock auth
from firebase_admin import auth # Specifically for InvalidIdTokenError if needed directly

# Import your FastAPI app
# Ensure that main.py and particularly the Firebase Admin SDK initialization
# is safe to run multiple times or is guarded (e.g., if firebase_admin.get_app() check)
# For testing, it's common to have a fixture that initializes Firebase once.
# However, given the current structure, we'll proceed assuming main.py handles this.
from main import app

client = TestClient(app)

# Mock Firebase credentials path for testing if not already handled by environment
# This might be necessary if main.py's Firebase init depends on it and it's not set in test env
# For example:
# import os
# os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "path/to/mock/credentials.json"
# Ensure this mock file exists or the init code in main.py can handle its absence gracefully for tests.
# For now, we assume main.py's error handling for Firebase init is sufficient for tests to run.

# It's good practice to ensure Firebase is initialized for tests that need it.
# If main.py doesn't initialize it because GOOGLE_APPLICATION_CREDENTIALS is not set,
# tests relying on firebase_admin.auth calls (even mocked) might fail if the
# auth module itself isn't available due to a failed initial firebase_admin.initialize_app().
# A more robust setup might involve a conftest.py to initialize Firebase for the test suite.

@patch('firebase_admin.auth.verify_id_token')
def test_auth_google_success(mock_verify_id_token):
    # Configure the mock to return a dictionary representing a decoded token
    mock_verify_id_token.return_value = {'uid': 'testuid123', 'email': 'test@example.com'}

    response = client.post("/auth/google", json={"token": "dummy_token_string"})

    assert response.status_code == 200
    assert response.json() == {"uid": "testuid123", "email": "test@example.com"}
    mock_verify_id_token.assert_called_once_with("dummy_token_string")

@patch('firebase_admin.auth.verify_id_token')
def test_auth_google_invalid_token(mock_verify_id_token):
    # Configure the mock to raise firebase_admin.auth.InvalidIdTokenError
    # Note: Ensure firebase_admin.auth is imported if you need to reference InvalidIdTokenError directly.
    # If main.py imports firebase_admin.auth, it should be available.
    # We are mocking 'firebase_admin.auth.verify_id_token', so the exception should be
    # available in the scope where firebase_admin.auth is used (i.e., main.py)
    mock_verify_id_token.side_effect = auth.InvalidIdTokenError("Invalid token")


    response = client.post("/auth/google", json={"token": "invalid_dummy_token"})

    assert response.status_code == 401
    assert "detail" in response.json()
    # Optionally, check the content of the detail message
    assert "Invalid ID token" in response.json()["detail"]
    mock_verify_id_token.assert_called_once_with("invalid_dummy_token")

def test_auth_google_missing_token():
    response = client.post("/auth/google", json={}) # Empty JSON body
    assert response.status_code == 422 # Unprocessable Entity for Pydantic validation error

    response_no_token_field = client.post("/auth/google", json={"not_token": "some_value"})
    assert response_no_token_field.status_code == 422

# Test for the /users/{user_id}/details endpoint (remains unchanged but kept for completeness)
def test_get_user_details():
    response = client.get("/users/testuser/details")
    assert response.status_code == 200
    data = response.json()
    assert "last_active" in data
    assert "points" in data
    assert "tasks_completed" in data
    assert isinstance(data["points"], int)
    assert data["points"] == 100
