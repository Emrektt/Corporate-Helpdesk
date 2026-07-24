import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, status
from app.core.config import settings

def validate_azure_token(token: str) -> dict:
    if not settings.TENANT_ID or not settings.BACKEND_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Azure configuration is missing on the server."
        )

    # Azure AD V2 JWKS endpoint
    try:
        # Decode without verification FIRST to get the tenant ID and print debug info
        unverified_payload = jwt.decode(token, options={"verify_signature": False, "verify_aud": False, "verify_iss": False})
        print(f"DEBUG Token Payload: {unverified_payload}", flush=True)
        
        token_tid = unverified_payload.get("tid", settings.TENANT_ID)
        
        # Use the token's actual tenant ID to fetch the correct public keys
        jwks_url = f"https://login.microsoftonline.com/{token_tid}/discovery/v2.0/keys"
        jwks_client = PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Verify the signature
        data = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False, "verify_iss": False}
        )
        
        # Manually verify tenant ID
        tid = data.get("tid")
        if tid and tid != settings.TENANT_ID:
            raise HTTPException(status_code=401, detail="Invalid Tenant ID in token")

        return data

    except jwt.PyJWKClientError as e:
        raise HTTPException(status_code=401, detail=f"Unable to fetch JWKS: {str(e)}")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except Exception as e:
        print(f"AZURE TOKEN ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
