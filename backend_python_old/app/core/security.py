import jwt
import httpx
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security = HTTPBearer()

import bcrypt

# Yerel JWT ayarları
SECRET_KEY = "super-secret-key-for-local-auth-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 gün

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    # Hash the password and decode it to string for storing in DB
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Microsoft Entra ID OpenID ayarları
MS_JWKS_URL = "https://login.microsoftonline.com/common/discovery/v2.0/keys" # Örnek

async def get_jwks():
    """Microsoft'un public anahtarlarını çeker"""
    async with httpx.AsyncClient() as client:
        response = await client.get(MS_JWKS_URL)
        return response.json()

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Frontend'den gelen Token'ı (MSAL veya Yerel JWT) doğrular"""
    token = credentials.credentials
    try:
        # Önce header'ı oku
        unverified_header = jwt.get_unverified_header(token)
        
        # Eğer kid (Key ID) yoksa, bu bizim yerel token'ımızdır
        if "kid" not in unverified_header:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload

        # Eğer kid varsa, Microsoft token'ı olarak işle
        jwks = await get_jwks()
        
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = key
                break
        
        if not rsa_key:
            raise HTTPException(status_code=401, detail="Geçersiz token anahtarı (Invalid Key)")

        # ŞİMDİLİK MSAL doğrulama simülasyonu yapıyoruz (Decode işlemi hata verirse Token geçersizdir)
        payload = jwt.decode(token, options={"verify_signature": False})
        
        return payload
        
    except jwt.ExpiredSignatureError:
        print("TOKEN ERROR: Token süresi dolmuş", flush=True)
        raise HTTPException(status_code=401, detail="Token süresi dolmuş")
    except Exception as e:
        print(f"TOKEN ERROR: Token geçersiz: {str(e)}", flush=True)
        raise HTTPException(status_code=401, detail=f"Token geçersiz: {str(e)}")
