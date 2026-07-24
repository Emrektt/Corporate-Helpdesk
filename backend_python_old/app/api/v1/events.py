from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import traceback

from app.core.database import get_db
from app.api.dependencies import get_current_user, get_optional_user
from app.models.user import User, UserRole
from app.models.event import EventLog

router = APIRouter()

class EventCreate(BaseModel):
    level: str                          # INFO, WARNING, ERROR, CRITICAL
    source: str                         # FRONTEND, BACKEND, AUTH
    event_type: Optional[str] = None   # LOGIN, LOGOUT, ERROR, PAGE_LOAD, etc.
    message: str
    stack_trace: Optional[str] = None
    ip_address: Optional[str] = None   # Frontend'den gönderilmiyorsa backend doldurur

class EventResponse(BaseModel):
    id: int
    level: str
    source: str
    event_type: Optional[str] = None
    message: str
    stack_trace: Optional[str] = None
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


def get_client_ip(request: Request) -> str:
    """Gerçek istemci IP'sini döner (proxy arkasındaysa X-Forwarded-For'a bakar)."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def create_event_log(
    db: Session,
    level: str,
    source: str,
    message: str,
    event_type: Optional[str] = None,
    stack_trace: Optional[str] = None,
    user: Optional[User] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> EventLog:
    """Herhangi bir yerden çağrılabilen yardımcı fonksiyon."""
    event = EventLog(
        level=level,
        source=source,
        event_type=event_type,
        message=message,
        stack_trace=stack_trace,
        user_id=user.id if user else None,
        user_email=user.email if user else None,
        user_name=user.full_name if user else None,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.post("/", response_model=EventResponse)
def log_event(
    event_in: EventCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Herhangi bir kaynaktan gelen log/hata bilgisini veritabanına yazar."""
    ip = event_in.ip_address or get_client_ip(request)
    ua = request.headers.get("User-Agent")

    new_event = EventLog(
        level=event_in.level,
        source=event_in.source,
        event_type=event_in.event_type,
        message=event_in.message,
        stack_trace=event_in.stack_trace,
        user_id=current_user.id if current_user else None,
        user_email=current_user.email if current_user else None,
        user_name=current_user.full_name if current_user else None,
        ip_address=ip,
        user_agent=ua,
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event


@router.get("/", response_model=List[EventResponse])
def get_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sadece Admin yetkisi olanların tüm logları listelemesini sağlar."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Sadece Admin yetkilileri sistem loglarını görebilir.")

    return db.query(EventLog).order_by(EventLog.created_at.desc()).limit(2000).all()
