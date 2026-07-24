from fastapi.testclient import TestClient
from app.models.department import Department

def test_create_department(client: TestClient, admin_token_headers):
    data = {"name": "IT Department"}
    response = client.post("/api/v1/departments/", json=data, headers=admin_token_headers)
    assert response.status_code == 201
    assert response.json()["name"] == "IT Department"
    assert "id" in response.json()

def test_create_department_unauthorized(client: TestClient, user_token_headers):
    data = {"name": "HR Department"}
    response = client.post("/api/v1/departments/", json=data, headers=user_token_headers)
    assert response.status_code == 403

def test_get_departments(client: TestClient, user_token_headers, db):
    # First create a department directly in DB or via API
    dept = Department(name="Finance")
    db.add(dept)
    db.commit()
    
    response = client.get("/api/v1/departments/", headers=user_token_headers)
    assert response.status_code == 200
    assert len(response.json()) > 0
    names = [d["name"] for d in response.json()]
    assert "Finance" in names

def test_update_department(client: TestClient, admin_token_headers, db):
    dept = Department(name="Old Name")
    db.add(dept)
    db.commit()
    db.refresh(dept)
    
    data = {"name": "New Name"}
    response = client.put(f"/api/v1/departments/{dept.id}", json=data, headers=admin_token_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"

def test_delete_department(client: TestClient, admin_token_headers, db):
    dept = Department(name="To Be Deleted")
    db.add(dept)
    db.commit()
    db.refresh(dept)
    
    response = client.delete(f"/api/v1/departments/{dept.id}", headers=admin_token_headers)
    assert response.status_code == 200
    
    # Verify deletion
    deleted_dept = db.query(Department).filter(Department.id == dept.id).first()
    assert deleted_dept is None
