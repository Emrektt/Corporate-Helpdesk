from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User, UserRole

router = APIRouter()

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    department_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Sadece Admin yetkisi olanların tüm üyeleri listelemesini sağlar."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Sadece Admin yetkilileri üye listesini görebilir.")
        
    users = db.query(User).order_by(User.id.asc()).all()
    return users
