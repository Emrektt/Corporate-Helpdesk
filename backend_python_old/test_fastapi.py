from fastapi.testclient import TestClient
from app.main import app
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.ticket import Ticket, TicketStatus
from app.core.database import SessionLocal

db = SessionLocal()
user = db.query(User).first()

# Override auth
app.dependency_overrides[get_current_user] = lambda: user

# Create a fresh ticket to rate
ticket = Ticket(
    ticket_number="TK-FASTAPI",
    title="Test CSAT",
    description="Test CSAT description",
    status=TicketStatus.CLOSED,
    category_id=1,
    department_id=1,
    created_by_id=user.id
)
db.add(ticket)
db.commit()
db.refresh(ticket)

client = TestClient(app)
response = client.post(f"/api/v1/tickets/{ticket.id}/csat", json={"score": 5, "comment": "test"})
print("Response status:", response.status_code)
print("Response body:", response.json())
