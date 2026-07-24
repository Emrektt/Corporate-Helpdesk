from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class CommentUser(BaseModel):
    id: int
    full_name: str
    role: str

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    is_internal: bool = False

class CommentResponse(BaseModel):
    id: int
    message: str
    is_internal: bool
    created_at: datetime
    user: CommentUser

    class Config:
        from_attributes = True
