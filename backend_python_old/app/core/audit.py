from fastapi import Request
from sqlalchemy.orm import Session
from app.models.event import EventLog
from app.models.user import User

def get_client_ip(request: Request) -> str:
    """Gerçek istemci IP'sini döner."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

def log_audit_event(
    db: Session,
    request: Request | None,
    level: str,
    source: str,
    event_type: str,
    message: str,
    user: User | None = None,
):
    """Sistem olaylarını EventLog tablosuna kaydeder."""
    ip = None
    ua = None
    if request:
        ip = get_client_ip(request)
        ua = request.headers.get("User-Agent", "unknown")

    event = EventLog(
        level=level,
        source=source,
        event_type=event_type,
        message=message,
        user_id=user.id if user else None,
        user_email=user.email if user else None,
        user_name=user.full_name if user else None,
        ip_address=ip,
        user_agent=ua,
    )
    db.add(event)
    db.commit()
