from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DepartmentInfo(BaseModel):
    id: int
    name: str

class AuthorInfo(BaseModel):
    id: int
    full_name: str

class ArticleBase(BaseModel):
    title: str
    content: str
    department_id: int
    is_published: bool = True

class ArticleCreate(ArticleBase):
    pass

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    department_id: Optional[int] = None
    is_published: Optional[bool] = None

class ArticleResponse(ArticleBase):
    id: int
    view_count: int
    created_by_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    department: DepartmentInfo
    author: AuthorInfo

    class Config:
        from_attributes = True
