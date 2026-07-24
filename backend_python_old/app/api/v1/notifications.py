from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.api.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Kullanıcının kendi bildirimlerini getirir"""
    return db.query(Notification).filter(
        Notification.recipient_user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()

@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Belirli bir bildirimi okundu olarak işaretler"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.recipient_user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Bildirim bulunamadı")
        
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification

@router.put("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tüm bildirimleri okundu olarak işaretler"""
    db.query(Notification).filter(
        Notification.recipient_user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    
    db.commit()
    return {"message": "Tüm bildirimler okundu olarak işaretlendi"}
