from pydantic import BaseModel
from typing import List
from app.models.category import PriorityLevel

class CategoryBase(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class CategoryCreate(BaseModel):
    name: str
    department_id: int
    default_priority: PriorityLevel = PriorityLevel.MEDIUM

class DepartmentBase(BaseModel):
    id: int
    name: str

class DepartmentCreate(BaseModel):
    name: str

class DepartmentUpdate(BaseModel):
    name: str

class DepartmentWithCategories(DepartmentBase):
    categories: List[CategoryBase] = []

    class Config:
        from_attributes = True
