from pydantic import BaseModel
from datetime import datetime

class AttachmentResponse(BaseModel):
    id: int
    file_name: str
    content_type: str
    size: int
    created_at: datetime

    class Config:
        from_attributes = True
