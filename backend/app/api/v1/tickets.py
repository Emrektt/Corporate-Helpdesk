from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import string
import random
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.core.audit import log_audit_event
from app.models.user import User, UserRole
from app.models.ticket import Ticket, TicketStatus
from app.models.category import Category, PriorityLevel
from app.models.notification import Notification
from app.schemas.ticket import TicketCreate, TicketResponse

# SLA süresi (saat cinsinden) öncelik seviyesine göre
SLA_HOURS = {
    PriorityLevel.CRITICAL: 2,
    PriorityLevel.HIGH: 8,
    PriorityLevel.MEDIUM: 24,
    PriorityLevel.LOW: 72,
}

router = APIRouter()

def generate_ticket_number():
    """Rastgele bilet numarası üretir (Örn: TK-A8B9C)"""
    chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"TK-{chars}"

@router.post("/", response_model=TicketResponse, status_code=201)
def create_ticket(
    ticket_in: TicketCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Yeni bir destek talebi oluşturur"""
    
    # 1. Kategoriyi bul
    category = db.query(Category).filter(Category.id == ticket_in.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı")

    # SLA due_at hesapla
    priority = category.default_priority
    sla_hours = SLA_HOURS.get(priority, 24)
    new_ticket = Ticket(
        ticket_number=generate_ticket_number(),
        title=ticket_in.title,
        description=ticket_in.description,
        status=TicketStatus.OPEN,
        priority=priority,
        category_id=category.id,
        department_id=category.department_id,
        created_by_id=current_user.id,
        due_at=datetime.now(timezone.utc) + timedelta(hours=sla_hours)
    )

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    
    # Log audit event
    log_audit_event(
        db=db,
        request=request,
        level="INFO",
        source="TICKET",
        event_type="TICKET_CREATED",
        message=f"{current_user.full_name} yeni bilet oluşturdu: {new_ticket.ticket_number} - {new_ticket.title}",
        user=current_user,
    )

    # Todo: Bildirim eklenecek

    return new_ticket

from typing import List, Optional
from sqlalchemy import or_

from app.schemas.ticket import TicketCreate, TicketResponse, PaginatedTickets

@router.get("/", response_model=PaginatedTickets)
def get_tickets(
    search: Optional[str] = None,
    status: Optional[TicketStatus] = None,
    priority: Optional[str] = None,
    as_user: Optional[bool] = False,
    page: int = 1,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Kullanıcının rolüne göre biletleri listeler ve filtreler (sayfalamalı)"""
    query = db.query(Ticket)

    # Rol bazlı yetkilendirme (Admin veya Support değilse sadece kendi açtığı biletleri görebilir)
    # Eğer Admin as_user=True gönderirse yine sadece kendi açtığı biletleri görür
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT_AGENT] or as_user:
        query = query.filter(Ticket.created_by_id == current_user.id)

    # Dinamik Filtreler
    if status:
        query = query.filter(Ticket.status == status)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Ticket.title.ilike(search_term),
                Ticket.ticket_number.ilike(search_term)
            )
        )

    # Toplam kayıt sayısı
    total = query.count()

    # Sayfalama
    skip = (page - 1) * limit
    items = query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": items
    }

@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Belirli bir biletin detaylarını getirir"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Bilet bulunamadı")
        
    return ticket

@router.delete("/{ticket_id}")
def delete_ticket(
    ticket_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin yetkisi olan kullanıcıların bileti silmesini sağlar"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Bilet silmek için Admin yetkisi gereklidir")

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Bilet bulunamadı")

    ticket_num = ticket.ticket_number
    db.delete(ticket)
    db.commit()

    log_audit_event(
        db=db,
        request=request,
        level="WARNING",
        source="TICKET",
        event_type="TICKET_DELETED",
        message=f"Admin {current_user.full_name} bileti sildi: {ticket_num}",
        user=current_user,
    )

    return {"message": "Bilet başarıyla silindi"}

from app.models.ticket_comment import TicketComment
from app.schemas.comment import CommentCreate, CommentResponse
from pydantic import BaseModel

class TicketStatusUpdate(BaseModel):
    status: TicketStatus

@router.get("/{ticket_id}/comments", response_model=List[CommentResponse])
def get_ticket_comments(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bir biletin tüm yorumlarını getirir"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Bilet bulunamadı")
        
    query = db.query(TicketComment).filter(TicketComment.ticket_id == ticket_id)

    comments = query.order_by(TicketComment.created_at.asc()).all()
    return comments

@router.post("/{ticket_id}/comments", response_model=CommentResponse)
def add_ticket_comment(
    ticket_id: int,
    comment_in: CommentCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bilete yeni yorum ekler"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Bilet bulunamadı")

    is_internal = comment_in.is_internal

    new_comment = TicketComment(
        ticket_id=ticket_id,
        user_id=current_user.id,
        message=comment_in.message,
        is_internal=is_internal
    )
    
    db.add(new_comment)
    
    # Notification logic
    if not is_internal:
        if current_user.role == UserRole.ADMIN:
            # Admin replied, notify the creator
            notif = Notification(
                recipient_user_id=ticket.created_by_id,
                ticket_id=ticket.id,
                title="Talebinize Yeni Yanıt",
                message=f"{ticket.ticket_number} numaralı talebinize yanıt geldi."
            )
            db.add(notif)
        else:
            # User replied, notify the assignee if exists
            if ticket.assigned_to_id:
                notif = Notification(
                    recipient_user_id=ticket.assigned_to_id,
                    ticket_id=ticket.id,
                    title="Kullanıcı Yanıtı",
                    message=f"{ticket.ticket_number} numaralı talebe kullanıcı yanıt verdi."
                )
                db.add(notif)
    
    
    db.commit()
    db.refresh(new_comment)

    # Log audit event
    log_audit_event(
        db=db,
        request=request,
        level="INFO",
        source="TICKET_COMMENT",
        event_type="COMMENT_ADDED",
        message=f"{current_user.full_name}, {ticket.ticket_number} numaralı bilete yorum yaptı.",
        user=current_user,
    )

    return new_comment

@router.patch("/{ticket_id}/status", response_model=TicketResponse)
def update_ticket_status(
    ticket_id: int,
    status_update: TicketStatusUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Biletin durumunu günceller (Sadece Yetkililer)"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Bilet bulunamadı")

    ticket.status = status_update.status
    
    # Notify creator of status change
    notif = Notification(
        recipient_user_id=ticket.created_by_id,
        ticket_id=ticket.id,
        title="Talep Durumu Güncellendi",
        message=f"{ticket.ticket_number} numaralı talebinizin durumu '{status_update.status}' olarak değiştirildi."
    )
    db.add(notif)
    
    db.commit()
    db.refresh(ticket)

    # Log audit event
    log_audit_event(
        db=db,
        request=request,
        level="INFO",
        source="TICKET",
        event_type="STATUS_UPDATED",
        message=f"{current_user.full_name}, {ticket.ticket_number} numaralı biletin durumunu '{status_update.status}' olarak güncelledi.",
        user=current_user,
    )

    return ticket

import os
import shutil
from fastapi import UploadFile, File
from fastapi.responses import FileResponse
from app.models.ticket_attachment import TicketAttachment
from app.schemas.attachment import AttachmentResponse

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/{ticket_id}/attachments", response_model=AttachmentResponse)
def upload_ticket_attachment(
    ticket_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bilete yeni dosya ekler"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Bilet bulunamadı")

    file_path = os.path.join(UPLOAD_DIR, f"{ticket_id}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)

    new_attachment = TicketAttachment(
        ticket_id=ticket_id,
        uploaded_by_id=current_user.id,
        file_name=file.filename,
        file_path=file_path,
        content_type=file.content_type or "application/octet-stream",
        size=file_size
    )
    
    db.add(new_attachment)
    db.commit()
    db.refresh(new_attachment)
    return new_attachment

@router.get("/{ticket_id}/attachments/{attachment_id}")
def download_ticket_attachment(
    ticket_id: int,
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bilete ait dosyayı indirir/görüntüler"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Bilet bulunamadı")

    attachment = db.query(TicketAttachment).filter(TicketAttachment.id == attachment_id, TicketAttachment.ticket_id == ticket_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")

    if not os.path.exists(attachment.file_path):
        raise HTTPException(status_code=404, detail="Dosya sunucuda bulunamadı")

    return FileResponse(path=attachment.file_path, filename=attachment.file_name, media_type=attachment.content_type)


# ── SLA Status Endpoint ────────────────────────────────────────────────────────

from typing import Dict, Any

@router.get("/{ticket_id}/sla")
def get_sla_status(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Biletin SLA durumunu döndürür"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Bilet bulunamadı")

    if not ticket.due_at:
        return {"has_sla": False}

    now = datetime.now(timezone.utc)
    due = ticket.due_at.replace(tzinfo=timezone.utc) if ticket.due_at.tzinfo is None else ticket.due_at
    remaining = due - now
    remaining_seconds = int(remaining.total_seconds())
    is_resolved = ticket.status in [TicketStatus.RESOLVED, TicketStatus.CLOSED]

    if is_resolved:
        sla_status = "resolved"
    elif remaining_seconds < 0:
        sla_status = "breached"   # Kırmızı: Süre aşıldı
    elif remaining_seconds < 3600:
        sla_status = "warning"    # Sarı: 1 saatin altında
    else:
        sla_status = "ok"         # Yeşil

    hours, rem = divmod(abs(remaining_seconds), 3600)
    minutes = rem // 60

    return {
        "has_sla": True,
        "status": sla_status,
        "due_at": ticket.due_at.isoformat(),
        "remaining_seconds": remaining_seconds,
        "remaining_label": f"{hours}s {minutes}dk" if remaining_seconds >= 0 else f"{hours}s {minutes}dk geçti",
        "is_breached": remaining_seconds < 0 and not is_resolved,
    }


# ── CSAT Endpoint ──────────────────────────────────────────────────────────────

class CSATSubmit(BaseModel):
    score: int       # 1-5
    comment: str = ""

@router.post("/{ticket_id}/csat")
def submit_csat(
    ticket_id: int,
    data: CSATSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bilete CSAT puanı ver (sadece bilet sahibi, sadece RESOLVED durumunda)"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Bilet bulunamadı")

    if ticket.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sadece bilet sahibi değlendirme yapabilir.")

    if ticket.status not in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
        print(f"DEBUG CSAT: Status failed. Status is {ticket.status} type {type(ticket.status)}")
        raise HTTPException(status_code=400, detail="Sadece çözülen biletler değlendirilebilir.")

    if ticket.csat_score is not None:
        print(f"DEBUG CSAT: Score already exists. Score is {ticket.csat_score}")
        raise HTTPException(status_code=400, detail="Bu bilet daha önce değerlendirilmiş.")

    if not (1 <= data.score <= 5):
        print(f"DEBUG CSAT: Invalid score {data.score}")
        raise HTTPException(status_code=422, detail="Puan 1-5 arasında olmalıdır.")

    ticket.csat_score = data.score
    ticket.csat_comment = data.comment
    ticket.csat_submitted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)

    return {"message": "Değlendirmeniz kaydedildi. Teşekkürler!", "score": data.score}
