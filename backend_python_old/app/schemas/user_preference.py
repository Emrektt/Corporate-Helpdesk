from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserPreferenceBase(BaseModel):
    email_notifications: Optional[bool] = True
    desktop_notifications: Optional[bool] = True
    theme: Optional[str] = "system"
    language: Optional[str] = "tr"

class UserPreferenceUpdate(BaseModel):
    email_notifications: Optional[bool] = None
    desktop_notifications: Optional[bool] = None
    theme: Optional[str] = None
    language: Optional[str] = None

class UserPreferenceResponse(UserPreferenceBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
