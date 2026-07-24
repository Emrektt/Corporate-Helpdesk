from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User, UserRole

async def get_current_user(
    token_payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
) -> User:
    """Token içerisindeki kullanıcı bilgisiyle veritabanındaki kullanıcıyı bulur"""
    
    oid = token_payload.get("oid")
    # Yerel token'da email 'sub' içerisindedir. MSAL token'larında 'preferred_username' veya 'email' kullanılır.
    email = token_payload.get("preferred_username") or token_payload.get("email")
    if not email and "kid" not in token_payload: # 'kid' yoksa yerel token'dır, sub=email demektir.
        email = token_payload.get("sub")
        
    # MSAL Access Token'larında email hiç gelmeyebilir, sadece OID üzerinden kullanıcıyı bulabiliriz.
    if not email and not oid:
        print("DEPENDENCY ERROR: Token içinde kullanıcı tanımlayıcı bilgi bulunamadı", flush=True)
        raise HTTPException(status_code=401, detail="Token içinde kullanıcı tanımlayıcı bilgi bulunamadı")

    user = None
    
    # 1. Öncelik: Microsoft Object ID (OID) ile arama
    if oid:
        user = db.query(User).filter(User.entra_object_id == oid).first()
        
    # 2. Öncelik: Email ile arama (Yerel kullanıcılar veya OID'si henüz kaydedilmemiş kullanıcılar)
    if not user and email:
        user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Sisteme ilk kez giren Microsoft kullanıcısını otomatik kaydet
        if not email:
            # Eğer email claim'i hiç gelmemişse geçici bir email oluştur (veritabanı constraint'i için)
            email = f"{oid}@msal.local"
            
        full_name = token_payload.get("name") or email.split("@")[0]
        
        user = User(
            email=email,
            full_name=full_name,
            entra_object_id=oid,
            role=UserRole.SUPPORT_AGENT
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Kullanıcı hesabı pasif durumda")
        
    return user

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Bu işlem için ADMIN yetkisi gereklidir")
    return current_user

def require_support_agent(current_user: User = Depends(get_current_user)):
    # Support Agent konsepti kalktı. Admin dışındaki yazılım takımları hepsi destek verebilir.
    return current_user

async def get_optional_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User | None:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    
    try:
        from app.core.security import verify_token
        from fastapi.security import HTTPAuthorizationCredentials
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        payload = await verify_token(credentials)
        return await get_current_user(token_payload=payload, db=db)
    except Exception:
        return None
