from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User, UserRole

router = APIRouter()

class UserRegisterReq(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class UserLoginReq(BaseModel):
    email: EmailStr
    password: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(req: UserRegisterReq, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(User).filter(User.email == req.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kullanımda.")
        
    hashed_pw = get_password_hash(req.password)
    new_user = User(
        email=req.email,
        full_name=req.full_name,
        hashed_password=hashed_pw,
        role=UserRole.EMPLOYEE
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "Kayıt başarılı. Şimdi giriş yapabilirsiniz."}

@router.post("/login")
def login_user(req: UserLoginReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not user.hashed_password:
        # User doesn't exist or only has MSAL login
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı.")
        
    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı.")
        
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Hesabınız pasif durumda.")
        
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Mevcut giriş yapmış kullanıcının profil bilgilerini döner"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "department_id": current_user.department_id,
        "is_active": current_user.is_active
    }

@router.get("/permissions")
def get_permissions(current_user: User = Depends(get_current_user)):
    """Kullanıcının rolüne göre yapabileceği işlemlerin (permission) listesini döner"""
    permissions = []
    
    if current_user.role == "ADMIN":
        permissions = ["manage_users", "manage_departments", "manage_categories", "view_all_tickets"]
    elif current_user.role == "SUPPORT_AGENT":
        permissions = ["view_department_tickets", "assign_tickets", "change_status", "add_internal_comments"]
    elif current_user.role == "EMPLOYEE":
        permissions = ["create_ticket", "view_own_tickets", "add_comments"]
        
    return {
        "role": current_user.role,
        "permissions": permissions
    }
