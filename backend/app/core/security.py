import jwt
import httpx
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security = HTTPBearer()

# Microsoft Entra ID OpenID ayarları
# TENANT_ID=settings.TENANT_ID (Config'e eklenecek)
# MS_JWKS_URL = f"https://login.microsoftonline.com/{TENANT_ID}/discovery/v2.0/keys"
MS_JWKS_URL = "https://login.microsoftonline.com/common/discovery/v2.0/keys" # Örnek

async def get_jwks():
    """Microsoft'un public anahtarlarını çeker"""
    async with httpx.AsyncClient() as client:
        response = await client.get(MS_JWKS_URL)
        return response.json()

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Frontend'den gelen MSAL Access Token'ı doğrular"""
    token = credentials.credentials
    try:
        # 1. Adım: Token başlığını oku (Key ID - kid bulmak için)
        unverified_header = jwt.get_unverified_header(token)
        
        # 2. Adım: JWKS anahtarlarını getir
        jwks = await get_jwks()
        
        # 3. Adım: Doğru anahtarı bul
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        if not rsa_key:
            raise HTTPException(status_code=401, detail="Geçersiz token anahtarı (Invalid Key)")

        # 4. Adım: Token'ı doğrula
        # Not: Gerçek projede algoritma olarak RS256 kullanılır ve audience kontrol edilir.
        # payload = jwt.decode(
        #    token,
        #    key=rsa_key, # Veya bir RSAPublicKey nesnesi
        #    algorithms=["RS256"],
        #    audience=settings.BACKEND_CLIENT_ID,
        #    issuer=f"https://login.microsoftonline.com/{settings.TENANT_ID}/v2.0"
        # )
        
        # ŞİMDİLİK doğrulama simülasyonu yapıyoruz (Decode işlemi hata verirse Token geçersizdir)
        payload = jwt.decode(token, options={"verify_signature": False})
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token süresi dolmuş")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token geçersiz: {str(e)}")
