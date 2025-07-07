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
@patch('main.configure_gemini') # Patch configure_gemini in main.py
@patch('firebase_admin.auth.verify_id_token')
@pytest.mark.asyncio
async def test_chat_endpoint_learn_command_success(mock_verify_id_token, mock_configure_gemini):
    user_uid = "chatuser123"
    user_email = "chatuser@navgurukul.org"
    mock_verify_id_token.return_value = {'uid': user_uid, 'email': user_email}

    mock_gemini_model = MagicMock()
    mock_configure_gemini.return_value = mock_gemini_model

    mock_ai_response = MagicMock()
    mock_ai_response.text = "Explanation about loops."
    mock_gemini_model.generate_content_async = AsyncMock(return_value=mock_ai_response)

    chat_topic = "loops"
    test_message = f"/learn {chat_topic}"

    response = client.post(
        "/api/chat",
        headers={"Authorization": "Bearer validtoken"},
        json={"message": test_message}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["response"] == "Explanation about loops."
    assert data["isStructuredData"] == False
    mock_verify_id_token.assert_called_once_with("validtoken")
    mock_configure_gemini.assert_called_with(gemini_version="2.0")
    mock_gemini_model.generate_content_async.assert_called_once()
    # We could also assert the prompt content if necessary by inspecting call_args

@patch('main.configure_gemini')
@patch('firebase_admin.auth.verify_id_token')
@pytest.mark.asyncio
async def test_chat_endpoint_generate_command_success(mock_verify_id_token, mock_configure_gemini):
    user_uid = "genuser456"
    user_email = "genuser@navgurukul.org"
    mock_verify_id_token.return_value = {'uid': user_uid, 'email': user_email}

    mock_gemini_model = MagicMock()
    mock_configure_gemini.return_value = mock_gemini_model

    flowchart_json = {
        "nodes": [{"id": "1", "type": "start", "label": "Start", "x": 10, "y": 10}],
        "edges": [],
        "problemStatement": "A simple start node",
        "inputType": "single",
        "outputType": "none",
        "sampleInputs": ["n/a"],
        "sampleOutputs": ["n/a"]
    }
    mock_ai_response = MagicMock()
    # Simulate Gemini returning JSON string, potentially wrapped in markdown
    mock_ai_response.text = f"```json\n{json.dumps(flowchart_json)}\n```"
    mock_gemini_model.generate_content_async = AsyncMock(return_value=mock_ai_response)

    description = "a simple start node"
    test_message = f"/generate {description}"

    response = client.post(
        "/api/chat",
        headers={"Authorization": "Bearer anothervalidtoken"},
        json={"message": test_message}
    )
    assert response.status_code == 200
    data = response.json()
    assert json.loads(data["response"]) == flowchart_json # Compare parsed JSON
    assert data["isStructuredData"] == True
    mock_verify_id_token.assert_called_once_with("anothervalidtoken")
    mock_configure_gemini.assert_called_with(gemini_version="2.5")
    mock_gemini_model.generate_content_async.assert_called_once()
    # We could also assert the prompt content and generation_config used

@patch('main.configure_gemini') # Not strictly needed here as it shouldn't be called
@patch('firebase_admin.auth.verify_id_token')
@pytest.mark.asyncio
async def test_chat_endpoint_unknown_command(mock_verify_id_token, mock_configure_gemini):
    user_uid = "unknowncmduser"
    user_email = "unknown@navgurukul.org"
    mock_verify_id_token.return_value = {'uid': user_uid, 'email': user_email}

    test_message = "/unknown_command test"
    response = client.post(
        "/api/chat",
        headers={"Authorization": "Bearer unktok"},
        json={"message": test_message}
    )
    assert response.status_code == 200 # Fallback is a normal response
    data = response.json()
    assert data["response"] == "Sorry, I can only respond to `/learn <topic>` and `/generate <description>` commands at the moment."
    assert data["isStructuredData"] == False
    mock_verify_id_token.assert_called_once_with("unktok")
    mock_configure_gemini.assert_not_called() # Gemini should not be called for unknown commands

@patch('main.configure_gemini')
@patch('firebase_admin.auth.verify_id_token')
@pytest.mark.asyncio
async def test_chat_endpoint_gemini_not_configured(mock_verify_id_token, mock_configure_gemini):
    user_uid = "erroruser"
    user_email = "error@navgurukul.org"
    mock_verify_id_token.return_value = {'uid': user_uid, 'email': user_email}

    mock_configure_gemini.return_value = None # Simulate Gemini not being configured

    test_message = "/learn topic"
    response = client.post(
        "/api/chat",
        headers={"Authorization": "Bearer errtoken"},
        json={"message": test_message}
    )
    assert response.status_code == 503
    data = response.json()
    assert "AI Service not configured" in data["detail"]
    mock_verify_id_token.assert_called_once_with("errtoken")
    mock_configure_gemini.assert_called_with(gemini_version="2.0")

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


# Need to import json for the test_chat_endpoint_generate_command_success
import json

# --- Tests for /api/flowchart/patch endpoint ---

def test_patch_flowchart_add_nodes_and_edges():
    initial_flowchart = {
        "nodes": [
            {"id": "start1", "type": "start", "label": "Start", "x": 50, "y": 50},
            {"id": "end1", "type": "end", "label": "End", "x": 50, "y": 250}
        ],
        "edges": [
            {"id": "edge1", "source": "start1", "target": "end1"}
        ]
    }
    patch_data = {
        "nodes_to_add": [
            {"id": "proc1", "type": "process", "label": "Process 1", "x": 50, "y": 150}
        ],
        "edges_to_add": [
            {"id": "edge2", "source": "start1", "target": "proc1"},
            {"id": "edge3", "source": "proc1", "target": "end1"}
        ]
    }
    # The original edge "edge1" would typically be removed or replaced by a more sophisticated patch,
    # but current endpoint is purely additive. For this test, we'll assume edge1 is still there or
    # the patch implies a new structure. The endpoint doesn't delete existing elements.

    response = client.post(
        "/api/flowchart/patch",
        json={"current_flowchart": initial_flowchart, "patch": patch_data}
    )
    assert response.status_code == 200
    updated_flowchart = response.json()

    assert len(updated_flowchart["nodes"]) == 3
    assert any(node["id"] == "proc1" for node in updated_flowchart["nodes"])

    assert len(updated_flowchart["edges"]) == 3 # edge1, edge2, edge3
    assert any(edge["id"] == "edge2" for edge in updated_flowchart["edges"])
    assert any(edge["id"] == "edge3" for edge in updated_flowchart["edges"])
    assert any(edge["id"] == "edge1" for edge in updated_flowchart["edges"]) # Original edge remains

def test_patch_flowchart_empty_patch():
    initial_flowchart = {
        "nodes": [{"id": "start1", "type": "start", "label": "Start", "x": 50, "y": 50}],
        "edges": []
    }
    patch_data = {"nodes_to_add": [], "edges_to_add": []}
    response = client.post(
        "/api/flowchart/patch",
        json={"current_flowchart": initial_flowchart, "patch": patch_data}
    )
    assert response.status_code == 200
    updated_flowchart = response.json()
    assert updated_flowchart["nodes"] == initial_flowchart["nodes"]
    assert updated_flowchart["edges"] == initial_flowchart["edges"]

def test_patch_flowchart_add_node_duplicate_id():
    initial_flowchart = {
        "nodes": [{"id": "start1", "type": "start", "label": "Start", "x": 50, "y": 50}],
        "edges": []
    }
    patch_data = {
        "nodes_to_add": [{"id": "start1", "type": "process", "label": "Duplicate", "x": 100, "y": 100}],
        "edges_to_add": []
    }
    response = client.post(
        "/api/flowchart/patch",
        json={"current_flowchart": initial_flowchart, "patch": patch_data}
    )
    assert response.status_code == 400
    assert "Duplicate node ID 'start1'" in response.json()["detail"]

def test_patch_flowchart_add_edge_missing_node():
    initial_flowchart = {
        "nodes": [{"id": "start1", "type": "start", "label": "Start", "x": 50, "y": 50}],
        "edges": []
    }
    patch_data = {
        "nodes_to_add": [],
        "edges_to_add": [{"id": "edge1", "source": "start1", "target": "nonexistent"}]
    }
    response = client.post(
        "/api/flowchart/patch",
        json={"current_flowchart": initial_flowchart, "patch": patch_data}
    )
    assert response.status_code == 400
    assert "Target node 'nonexistent' for new edge 'edge1' not found" in response.json()["detail"]

def test_patch_flowchart_invalid_node_in_patch():
    initial_flowchart = {"nodes": [], "edges": []}
    patch_data = {
        "nodes_to_add": [{"id": "node1"}], # Missing type, label, x, y
        "edges_to_add": []
    }
    response = client.post(
        "/api/flowchart/patch",
        json={"current_flowchart": initial_flowchart, "patch": patch_data}
    )
    assert response.status_code == 400
    assert "Invalid node structure in patch" in response.json()["detail"]

def test_patch_flowchart_invalid_edge_in_patch():
    initial_flowchart = {"nodes": [], "edges": []}
    patch_data = {
        "nodes_to_add": [],
        "edges_to_add": [{"id": "edge1"}] # Missing source, target
    }
    response = client.post(
        "/api/flowchart/patch",
        json={"current_flowchart": initial_flowchart, "patch": patch_data}
    )
    assert response.status_code == 400
    assert "Invalid edge structure in patch" in response.json()["detail"]

# --- Tests for /api/diagnose-flowchart-error endpoint ---

# Mock the get_error_tutor_chain and its result for these tests
@patch('main.get_error_tutor_chain')
@pytest.mark.asyncio
async def test_diagnose_flowchart_error_success(mock_get_error_tutor_chain):
    # Mock the chain itself and its arun method
    mock_chain_instance = MagicMock()
    # arun should return a JSON string
    expected_tutor_response_obj = {
        "friendly_explanation": "You missed an input for 'varA'.",
        "suggested_fix": "Add an Input node for 'varA'.",
        "flowchart_patch": {
            "nodes_to_add": [{"id": "new_input_A", "type": "input", "label": "Input varA", "x": 10, "y": 20}],
            "edges_to_add": []
        }
    }
    mock_chain_instance.arun = AsyncMock(return_value=json.dumps(expected_tutor_response_obj))
    mock_get_error_tutor_chain.return_value = mock_chain_instance

    request_data = {
        "flowchart_json": {"nodes": [], "edges": []},
        "traceback": "NameError: name 'varA' is not defined"
    }
    response = client.post("/api/diagnose-flowchart-error", json=request_data)

    assert response.status_code == 200
    assert response.json() == expected_tutor_response_obj
    mock_get_error_tutor_chain.assert_called_once()
    flowchart_str_arg = json.dumps(request_data["flowchart_json"], indent=2)
    mock_chain_instance.arun.assert_called_once_with(flowchart=flowchart_str_arg, traceback=request_data["traceback"])

@patch('main.get_error_tutor_chain')
@pytest.mark.asyncio
async def test_diagnose_flowchart_error_chain_unavailable(mock_get_error_tutor_chain):
    mock_get_error_tutor_chain.return_value = None # Simulate chain not being available

    request_data = {"flowchart_json": {}, "traceback": "Some error"}
    response = client.post("/api/diagnose-flowchart-error", json=request_data)

    assert response.status_code == 503
    assert response.json()["detail"] == "Error tutor service is not available."

@patch('main.get_error_tutor_chain')
@pytest.mark.asyncio
async def test_diagnose_flowchart_error_chain_returns_invalid_json(mock_get_error_tutor_chain):
    mock_chain_instance = MagicMock()
    mock_chain_instance.arun = AsyncMock(return_value="this is not json")
    mock_get_error_tutor_chain.return_value = mock_chain_instance

    request_data = {"flowchart_json": {}, "traceback": "Some error"}
    response = client.post("/api/diagnose-flowchart-error", json=request_data)

    assert response.status_code == 500
    assert "Failed to parse JSON response from tutor chain" in response.json()["detail"]

@patch('main.get_error_tutor_chain')
@pytest.mark.asyncio
async def test_diagnose_flowchart_error_chain_returns_empty_result(mock_get_error_tutor_chain):
    mock_chain_instance = MagicMock()
    mock_chain_instance.arun = AsyncMock(return_value=None) # Simulate empty or None result
    mock_get_error_tutor_chain.return_value = mock_chain_instance

    request_data = {"flowchart_json": {}, "traceback": "Some error"}
    response = client.post("/api/diagnose-flowchart-error", json=request_data)

    assert response.status_code == 500 # Based on current error handling
    assert "Error tutor chain returned an empty result" in response.json()["detail"]


# We also need to test the get_error_tutor_chain() initialization logic itself,
# especially its interaction with environment variables and LangChain components.
# This is more of an integration test for that specific utility function.

@patch('langchain_google_genai.ChatGoogleGenerativeAI') # Mock the LLM class
@patch('langchain.chains.LLMChain') # Mock the LLMChain class
@patch.dict(os.environ, {"GEMINI_API_KEY": "test_key"}, clear=True) # Ensure GEMINI_API_KEY is set
def test_get_error_tutor_chain_initialization_success(mock_llmchain, mock_chatgoogle):
    # Reset global error_tutor_chain for fresh initialization
    main.error_tutor_chain = None

    # Mock instances returned by constructors
    mock_llm_instance = MagicMock()
    mock_chatgoogle.return_value = mock_llm_instance
    mock_chain_instance = MagicMock()
    mock_llmchain.return_value = mock_chain_instance

    chain = main.get_error_tutor_chain()
    assert chain is not None
    assert chain is mock_chain_instance # Check if it's the instance we expect
    mock_chatgoogle.assert_called_once_with(model="gemini-pro", google_api_key="test_key", temperature=0.1, convert_system_message_to_human=True)
    mock_llmchain.assert_called_once() # Further assertions on prompt can be added

    # Call again, should return cached instance
    chain2 = main.get_error_tutor_chain()
    assert chain2 is chain
    # Ensure constructors not called again
    mock_chatgoogle.assert_called_once()
    mock_llmchain.assert_called_once()


@patch.dict(os.environ, {}, clear=True) # Ensure GEMINI_API_KEY is NOT set
def test_get_error_tutor_chain_initialization_no_api_key():
    main.error_tutor_chain = None
    chain = main.get_error_tutor_chain()
    assert chain is None

# Import main to access error_tutor_chain for resetting, and os for environ mocking
import main
import os
