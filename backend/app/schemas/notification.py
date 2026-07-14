from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    title: str
    message: str
    ticket_id: Optional[int] = None
    is_read: bool = False

class NotificationCreate(NotificationBase):
    recipient_user_id: int

class NotificationResponse(NotificationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
