from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.canned_response import CannedResponse
from app.models.user import User, UserRole

router = APIRouter()

# ── Schemas ────────────────────────────────────────────────────────────────────

class CannedResponseCreate(BaseModel):
    title: str
    content: str
    category: Optional[str] = None

class CannedResponseUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None

class CannedResponseOut(BaseModel):
    id: int
    title: str
    content: str
    category: Optional[str]
    is_active: bool
    created_by_id: int

    class Config:
        from_attributes = True

# ── Helpers ────────────────────────────────────────────────────────────────────

def _require_support_or_admin(current_user: User):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT_AGENT]:
        raise HTTPException(status_code=403, detail="Yetkiniz yok.")

# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[CannedResponseOut])
def list_canned_responses(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Hazır cevapları listele (tüm yetkili kullanıcılar görebilir)."""
    q = db.query(CannedResponse).filter(CannedResponse.is_active == True)
    if search:
        q = q.filter(CannedResponse.title.ilike(f"%{search}%"))
    if category:
        q = q.filter(CannedResponse.category == category)
    return q.order_by(CannedResponse.title).all()


@router.post("/", response_model=CannedResponseOut, status_code=201)
def create_canned_response(
    data: CannedResponseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Yeni hazır cevap oluştur (Admin/Support)."""
    _require_support_or_admin(current_user)
    cr = CannedResponse(
        title=data.title,
        content=data.content,
        category=data.category,
        created_by_id=current_user.id
    )
    db.add(cr)
    db.commit()
    db.refresh(cr)
    return cr


@router.put("/{cr_id}", response_model=CannedResponseOut)
def update_canned_response(
    cr_id: int,
    data: CannedResponseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Hazır cevabı güncelle (Admin/Support)."""
    _require_support_or_admin(current_user)
    cr = db.query(CannedResponse).filter(CannedResponse.id == cr_id).first()
    if not cr:
        raise HTTPException(status_code=404, detail="Hazır cevap bulunamadı.")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(cr, field, value)
    db.commit()
    db.refresh(cr)
    return cr


@router.delete("/{cr_id}", status_code=200)
def delete_canned_response(
    cr_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Hazır cevabı sil (Admin/Support)."""
    _require_support_or_admin(current_user)
    cr = db.query(CannedResponse).filter(CannedResponse.id == cr_id).first()
    if not cr:
        raise HTTPException(status_code=404, detail="Hazır cevap bulunamadı.")
    db.delete(cr)
    db.commit()
    return {"message": "Hazır cevap silindi."}


@router.get("/categories", response_model=List[str])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mevcut hazır cevap kategorilerini listele."""
    rows = db.query(CannedResponse.category).filter(
        CannedResponse.is_active == True,
        CannedResponse.category != None
    ).distinct().all()
    return [r[0] for r in rows if r[0]]
