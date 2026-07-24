from pydantic import BaseModel, Field
from datetime import datetime
from app.schemas.department import DepartmentBase, CategoryBase
from app.schemas.attachment import AttachmentResponse
from typing import List, Optional

class TicketCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=150)
    description: str = Field(..., min_length=10)
    category_id: int

class TicketResponse(BaseModel):
    id: int
    ticket_number: str
    title: str
    description: str
    status: str
    priority: str
    category_id: int
    department_id: int
    created_by_id: int
    assigned_to_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    due_at: Optional[datetime] = None
    csat_score: Optional[int] = None
    csat_comment: Optional[str] = None
    csat_submitted_at: Optional[datetime] = None
    
    # İç içe nesneler
    department: DepartmentBase
    category: CategoryBase
    attachments: List[AttachmentResponse] = []

    class Config:
        from_attributes = True

class PaginatedTickets(BaseModel):
    total: int
    page: int
    limit: int
    items: List[TicketResponse]
