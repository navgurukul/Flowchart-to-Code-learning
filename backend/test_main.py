from fastapi.testclient import TestClient
from main import app # Assuming your FastAPI app instance is named 'app' in main.py

client = TestClient(app)

def test_google_signin():
    response = client.post("/auth/google")
    assert response.status_code == 200
    assert response.json() == {"message": "Google Sign-In initiated (placeholder)"}

def test_get_user_details():
    response = client.get("/users/testuser/details")
    assert response.status_code == 200
    data = response.json()
    assert "last_active" in data
    assert "points" in data
    assert "tasks_completed" in data
    assert isinstance(data["points"], int)
    # Optionally, assert the mock point value if it's stable
    assert data["points"] == 100
