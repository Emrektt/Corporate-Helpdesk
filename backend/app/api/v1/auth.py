from fastapi import APIRouter, Depends
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter()

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
