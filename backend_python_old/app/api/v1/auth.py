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


class AzureLoginReq(BaseModel):
    access_token: str

@router.post("/azure")
def login_with_azure(req: AzureLoginReq, request: Request, db: Session = Depends(get_db)):
    from app.core.azure import validate_azure_token
    
    # 1. Validate the Azure token
    token_data = validate_azure_token(req.access_token)
    
    # 2. Extract user info
    # The token usually has 'preferred_username' or 'upn' for email, and 'name'
    email = token_data.get("preferred_username") or token_data.get("upn") or token_data.get("email")
    name = token_data.get("name") or "Azure User"
    oid = token_data.get("oid")
    roles = token_data.get("roles", [])
    
    if not email:
        raise HTTPException(status_code=400, detail="Cannot find email in Azure token")

    # 3. Find user by Object ID or Email
    user = db.query(User).filter((User.entra_object_id == oid) | (User.email == email)).first()
    
    if not user:
        # Create new user
        user = User(
            email=email,
            full_name=name,
            entra_object_id=oid,
            is_active=True,
            role=UserRole.USER if hasattr(UserRole, 'USER') else UserRole.SUPPORT_AGENT # Fallback
        )
        db.add(user)
        db.flush() # To get user ID for logs
    else:
        # Update name and oid if they changed (e.g. they logged in with email before, now with Azure)
        if not user.entra_object_id:
            user.entra_object_id = oid
            
    # Map Azure App Roles to Local Roles and Departments
    role_mapping = {
        "ADMIN": UserRole.ADMIN,
        "SUPPORT_AGENT": UserRole.SUPPORT_AGENT,
        "BACKEND_DEV": UserRole.BACKEND_DEV,
        "FRONTEND_DEV": UserRole.FRONTEND_DEV,
        "SCRUM_MASTER": UserRole.SCRUM_MASTER,
        "TESTER": UserRole.TESTER,
        "DEVOPS": UserRole.DEVOPS,
        "PRODUCT_OWNER": UserRole.PRODUCT_OWNER,
    }
    
    dept_mapping = {
        UserRole.BACKEND_DEV: 1,    # Backend Team
        UserRole.FRONTEND_DEV: 2,   # Frontend Team
        UserRole.TESTER: 3,         # QA & Testing
        UserRole.DEVOPS: 4,         # DevOps
        UserRole.PRODUCT_OWNER: 5,  # Product Management
        UserRole.SCRUM_MASTER: 5,   # Product Management
    }
    
    for r in roles:
        if r in role_mapping:
            user.role = role_mapping[r]
            # Rolüne uygun bir departman varsa onu ata, yoksa eskisini koru (veya None yapma)
            if user.role in dept_mapping:
                user.department_id = dept_mapping[user.role]
            break # We found a matching role, update and stop

    db.commit()

    # 5. Issue local JWT
    access_token = create_access_token(data={"sub": user.email})
    
    # Log successful SSO login
    log_audit_event(
        db=db,
        request=request,
        level="INFO",
        source="AUTH",
        event_type="SSO_LOGIN_SUCCESS",
        message=f"{user.full_name} ({user.role.value}) sisteme Azure AD ile giriş yaptı.",
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
