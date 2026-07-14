from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User, UserRole

async def get_current_user(
    token_payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
) -> User:
    """Token içerisindeki kullanıcı email'inden veritabanındaki kullanıcıyı bulur"""
    
    # MSAL token'ından email bilgisini alıyoruz (oid, preferred_username veya email alanlarında olabilir)
    email = token_payload.get("preferred_username") or token_payload.get("email")
    
    if not email:
        raise HTTPException(status_code=401, detail="Token içinde email bilgisi bulunamadı")

    # Veritabanında kullanıcıyı ara
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Eğer kullanıcı giriş yaptıysa ama sistemde (veritabanında) yoksa hata ver veya yeni oluştur.
        raise HTTPException(status_code=403, detail="Bu kullanıcının sisteme erişim yetkisi yok")
        
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Kullanıcı hesabı pasif durumda")
        
    return user

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Bu işlem için ADMIN yetkisi gereklidir")
    return current_user

def require_support_agent(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT_AGENT]:
        raise HTTPException(status_code=403, detail="Bu işlem için SUPPORT_AGENT yetkisi gereklidir")
    return current_user
