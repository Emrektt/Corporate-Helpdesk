from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User, UserRole
from app.models.event import EventLog
from app.core.audit import log_audit_event, get_client_ip

router = APIRouter()

class UserRegisterReq(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class UserLoginReq(BaseModel):
    email: EmailStr

@router.post("/login")
def login_user(req: UserLoginReq, request: Request, db: Session = Depends(get_db)):
    ip = get_client_ip(request)
    ua = request.headers.get("User-Agent", "unknown")

    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        # Başarısız giriş denemesini logla
        log_audit_event(
            db=db,
            request=request,
            level="WARNING",
            source="AUTH",
            event_type="LOGIN_FAILED",
            message=f"Başarısız giriş denemesi: {req.email} — Kullanıcı bulunamadı.",
        )
        raise HTTPException(status_code=401, detail="Bu e-posta adresine sahip kullanıcı bulunamadı.")

    if not user.is_active:
        log_audit_event(
            db=db,
            request=request,
            level="WARNING",
            source="AUTH",
            event_type="LOGIN_BLOCKED",
            message=f"Pasif hesaba giriş denemesi: {req.email}",
            user=user,
        )
        raise HTTPException(status_code=403, detail="Hesabınız pasif durumda.")

    access_token = create_access_token(data={"sub": user.email})

    # Başarılı giriş logla
    log_audit_event(
        db=db,
        request=request,
        level="INFO",
        source="AUTH",
        event_type="LOGIN_SUCCESS",
        message=f"{user.full_name} ({user.role.value}) sisteme giriş yaptı.",
        user=user,
    )

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

    if current_user.role == UserRole.ADMIN:
        permissions = ["manage_users", "manage_departments", "manage_categories", "view_all_tickets"]
    elif current_user.role == UserRole.SUPPORT_AGENT:
        permissions = ["view_department_tickets", "assign_tickets", "change_status", "add_internal_comments"]
    else:
        permissions = ["create_ticket", "view_own_tickets", "add_comments"]

    return {
        "role": current_user.role,
        "permissions": permissions
    }
