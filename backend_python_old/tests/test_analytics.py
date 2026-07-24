from fastapi.testclient import TestClient
from app.models.ticket import Ticket, TicketStatus
from app.models.category import Category
from app.models.department import Department

def test_analytics_summary(client: TestClient, admin_token_headers, db, admin_user):
    # Setup some test data
    dept = Department(name="Ops")
    db.add(dept)
    db.commit()
    
    cat = Category(name="Issue", department_id=dept.id, default_priority="MEDIUM")
    db.add(cat)
    db.commit()

    t1 = Ticket(
        ticket_number="TK-111", title="T1", description="...", 
        status=TicketStatus.OPEN, priority="MEDIUM",
        category_id=cat.id, department_id=dept.id, created_by_id=admin_user.id
    )
    t2 = Ticket(
        ticket_number="TK-222", title="T2", description="...", 
        status=TicketStatus.RESOLVED, priority="HIGH",
        category_id=cat.id, department_id=dept.id, created_by_id=admin_user.id
    )
    db.add(t1)
    db.add(t2)
    db.commit()

    response = client.get("/api/v1/analytics/summary", headers=admin_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_tickets" in data
    assert data["total_tickets"] >= 2

def test_department_distribution(client: TestClient, admin_token_headers):
    response = client.get("/api/v1/analytics/departments", headers=admin_token_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_ticket_trend(client: TestClient, admin_token_headers):
    response = client.get("/api/v1/analytics/trend", headers=admin_token_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
