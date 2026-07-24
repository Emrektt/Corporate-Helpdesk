import pytest

def test_get_user_preferences_unauthenticated(client):
    response = client.get("/api/v1/user-preferences/me")
    assert response.status_code == 401

def test_get_and_update_user_preferences(client, test_user):
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "testuser@example.com", "password": "testpassword123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. GET preferences (should create defaults)
    get_res = client.get("/api/v1/user-preferences/me", headers=headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["email_notifications"] is True
    assert data["desktop_notifications"] is True
    assert data["theme"] == "system"
    assert data["language"] == "tr"

    # 2. PUT update preferences
    update_res = client.put(
        "/api/v1/user-preferences/me",
        headers=headers,
        json={"theme": "dark", "email_notifications": False}
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["theme"] == "dark"
    assert updated_data["email_notifications"] is False
    assert updated_data["desktop_notifications"] is True  # should remain unchanged
