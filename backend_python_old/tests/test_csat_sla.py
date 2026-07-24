def test_submit_csat_not_found(client, test_user):
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "testuser@example.com", "password": "testpassword123"}
    )
    token = login_res.json()["access_token"]
    
    response = client.post(
        "/api/v1/tickets/9999/csat",
        headers={"Authorization": f"Bearer {token}"},
        json={"score": 5, "comment": "Great!"}
    )
    assert response.status_code == 404

def test_sla_status_not_found(client, test_user):
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "testuser@example.com", "password": "testpassword123"}
    )
    token = login_res.json()["access_token"]
    
    response = client.get(
        "/api/v1/tickets/9999/sla",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 404
