import pytest

def test_login_success(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "testuser@example.com"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_failure(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com"}
    )
    assert response.status_code == 401

def test_get_me(client, test_user):
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "testuser@example.com"}
    )
    token = login_res.json()["access_token"]
    
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert data["full_name"] == "Test User"
