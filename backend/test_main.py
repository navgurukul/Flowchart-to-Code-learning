from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
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

# This test is removed because its success case (non-NG domain) is now a failure (403).
# The case is covered by test_auth_google_failure_other_domain.
# @patch('firebase_admin.auth.verify_id_token')
# def test_auth_google_success(mock_verify_id_token):
#     # Configure the mock to return a dictionary representing a decoded token
#     mock_verify_id_token.return_value = {'uid': 'testuid123', 'email': 'test@example.com'}
#
#     response = client.post("/auth/google", json={"token": "dummy_token_string"})
#
#     assert response.status_code == 200 # This would now be 403
#     assert response.json() == {"uid": "testuid123", "email": "test@example.com"}
#     mock_verify_id_token.assert_called_once_with("dummy_token_string")

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

@patch('firebase_admin.auth.verify_id_token')
def test_auth_google_success_navgurukul_domain(mock_verify_id_token):
    mock_verify_id_token.return_value = {'uid': 'nguser123', 'email': 'student@navgurukul.org'}
    response = client.post("/auth/google", json={"token": "ng_token_string"})
    assert response.status_code == 200
    assert response.json() == {"uid": "nguser123", "email": "student@navgurukul.org"}
    mock_verify_id_token.assert_called_once_with("ng_token_string")

@patch('firebase_admin.auth.verify_id_token')
def test_auth_google_failure_other_domain(mock_verify_id_token):
    mock_verify_id_token.return_value = {'uid': 'otheruser123', 'email': 'test@example.com'}
    response = client.post("/auth/google", json={"token": "other_domain_token"})
    assert response.status_code == 403
    assert response.json() == {"detail": "Access restricted to navgurukul.org domain."}
    mock_verify_id_token.assert_called_once_with("other_domain_token")

@patch('firebase_admin.auth.verify_id_token')
def test_auth_google_failure_no_email_in_token(mock_verify_id_token):
    mock_verify_id_token.return_value = {'uid': 'userwithnoemail'} # No email key
    response = client.post("/auth/google", json={"token": "no_email_token"})
    assert response.status_code == 400
    assert response.json() == {"detail": "Email not found in token."}
    mock_verify_id_token.assert_called_once_with("no_email_token")

def test_auth_google_missing_token():
    response = client.post("/auth/google", json={}) # Empty JSON body
    assert response.status_code == 422 # Unprocessable Entity for Pydantic validation error

    response_no_token_field = client.post("/auth/google", json={"not_token": "some_value"})
    assert response_no_token_field.status_code == 422

# --- Tests for /users/{user_id}/details endpoint ---

@patch('firebase_admin.initialize_app') # Mock Firebase app initialization
@patch.object(firebase_admin, '_apps', ['mock_app']) # Ensure _apps is not empty
@patch('firebase_admin.auth.verify_id_token')
@patch('firebase_admin.db.reference') # Mocking Firebase DB call
def test_get_user_details_success(mock_db_ref, mock_verify_id_token, mock_initialize_app): # mock_apps_true removed
    # Mock for verify_id_token
    user_uid = "testuser123"
    user_email = "testuser@navgurukul.org"
    mock_verify_id_token.return_value = {'uid': user_uid, 'email': user_email}

    # Mock for Firebase Realtime DB
    mock_user_progress_data = {
        "completedExercises": [1, 2],
        "totalScore": 150,
        "lastAccessedAt": "2023-01-01T12:00:00Z"
    }
    # Configure the chain of mocks for db.reference().get()
    mock_ref_instance = mock_db_ref.return_value
    mock_ref_instance.get.return_value = mock_user_progress_data

    response = client.get(
        f"/users/{user_uid}/details",
        headers={"Authorization": "Bearer dummyfbtoken"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "last_active" in data # This comes from lastAccessedAt
    assert data["points"] == mock_user_progress_data["totalScore"]
    assert data["tasks_completed"] == [str(ex_id) for ex_id in mock_user_progress_data["completedExercises"]]
    mock_verify_id_token.assert_called_once_with("dummyfbtoken")
    mock_db_ref.assert_called_once_with(f'userProgress/{user_uid}')
    mock_ref_instance.get.assert_called_once()


@patch('firebase_admin.auth.verify_id_token')
def test_get_user_details_unauthorized_different_user(mock_verify_id_token):
    requesting_user_uid = "requesteruid"
    target_user_uid = "otheruseruid"
    mock_verify_id_token.return_value = {'uid': requesting_user_uid, 'email': 'requester@navgurukul.org'}

    response = client.get(
        f"/users/{target_user_uid}/details",
        headers={"Authorization": "Bearer sometoken"}
    )
    assert response.status_code == 403
    assert response.json() == {"detail": "Not authorized to access this user's details."}
    mock_verify_id_token.assert_called_once_with("sometoken")


@patch('firebase_admin.auth.verify_id_token')
def test_get_user_details_forbidden_other_domain(mock_verify_id_token):
    user_uid = "testuser123"
    mock_verify_id_token.return_value = {'uid': user_uid, 'email': 'testuser@example.com'} # Non-NG domain

    response = client.get(
        f"/users/{user_uid}/details",
        headers={"Authorization": "Bearer otherdomaintoken"}
    )
    assert response.status_code == 403
    assert response.json() == {"detail": f"Access restricted to navgurukul.org domain."}
    mock_verify_id_token.assert_called_once_with("otherdomaintoken")


def test_get_user_details_no_token():
    response = client.get("/users/anyuser/details") # No Authorization header
    assert response.status_code == 403 # FastAPI's HTTPBearer returns 403 if not found, not 401
    assert response.json() == {"detail": "Not authenticated"}


# --- Tests for /api/chat endpoint ---

import pytest # Required for @pytest.mark.asyncio

@patch('main.configure_gemini') # Patch configure_gemini in main.py
@patch('firebase_admin.auth.verify_id_token')
@pytest.mark.asyncio
async def test_chat_endpoint_success(mock_verify_id_token, mock_configure_gemini):
    user_uid = "chatuser123"
    user_email = "chatuser@navgurukul.org"
    mock_verify_id_token.return_value = {'uid': user_uid, 'email': user_email}

    # Mock the Gemini model and its response
    mock_gemini_model = mock_configure_gemini.return_value
    if mock_gemini_model is None: # If configure_gemini returns None
        mock_gemini_model = mock_configure_gemini.return_value = MagicMock() # Ensure it's a mock

    # Mock the async method generate_content_async
    mock_ai_response = MagicMock()
    mock_ai_response.text = "Hello from AI!"

    # If generate_content_async is an async generator or needs await:
    mock_gemini_model.generate_content_async = AsyncMock(return_value=mock_ai_response)
    # For a simple return, plain MagicMock with a coroutine works for awaited calls
    # async def async_generate_content(*args, **kwargs):
    #     return mock_ai_response
    # mock_gemini_model.generate_content_async = async_generate_content


    chat_topic = "loops"
    test_message = f"/learn {chat_topic}"
    expected_prompt = (
        f"Explain the programming concept of '{chat_topic}' clearly and concisely, as if to a beginner learning about flowcharts.\n"
        f"Your explanation should include:\n"
        f"1. A definition of the concept.\n"
        f"2. How it is typically represented in a flowchart (mention symbol types if specific).\n"
        f"3. A very simple pseudo-code or code example (e.g., Python or JavaScript) to illustrate its use.\n"
        f"4. One or two key takeaways or common pitfalls related to '{chat_topic}'.\n"
        f"Focus on educational value and clarity. Use markdown for formatting if it helps readability (e.g., for lists or code blocks)."
    )

    response = client.post(
        "/api/chat",
        headers={"Authorization": "Bearer validtoken"},
        json={"message": test_message}
    )
    assert response.status_code == 200
    assert response.json() == {"response": "Hello from AI!", "isStructuredData": False}
    mock_verify_id_token.assert_called_once_with("validtoken")
    # Check if configure_gemini was called (it's called inside the endpoint)
    mock_configure_gemini.assert_called()
    mock_gemini_model.generate_content_async.assert_called_once_with(expected_prompt)


@patch('firebase_admin.auth.verify_id_token')
def test_chat_endpoint_forbidden_other_domain(mock_verify_id_token):
    mock_verify_id_token.return_value = {'uid': 'otherdomainuser', 'email': 'chat@example.com'}
    response = client.post(
        "/api/chat",
        headers={"Authorization": "Bearer otherdomaintok"},
        json={"message": "Hi"}
    )
    assert response.status_code == 403
    assert response.json() == {"detail": f"Access restricted to navgurukul.org domain."}


def test_chat_endpoint_no_token():
    response = client.post("/api/chat", json={"message": "Hi"})
    assert response.status_code == 403 # HTTPBearer returns 403
    assert response.json() == {"detail": "Not authenticated"}
