from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.ticket import Ticket, TicketStatus
from app.models.department import Department

router = APIRouter()

class AnalyticsSummary(BaseModel):
    total_tickets: int
    open_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    closed_tickets: int
    avg_csat_score: float | None
    sla_breached_count: int

class DepartmentDistribution(BaseModel):
    name: str
    count: int

class DailyTrend(BaseModel):
    date: str
    total: int
    resolved: int

@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(
    as_user: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Ticket)
    if as_user:
        query = query.filter(Ticket.created_by_id == current_user.id)

    total = query.count()
    open_count = query.filter(Ticket.status == TicketStatus.OPEN).count()
    in_progress = query.filter(Ticket.status == TicketStatus.IN_PROGRESS).count()
    resolved = query.filter(Ticket.status == TicketStatus.RESOLVED).count()
    closed = query.filter(Ticket.status == TicketStatus.CLOSED).count()

    from datetime import timezone
    now = datetime.now(timezone.utc)

    # CSAT ortalaması
    csat_result = query.with_entities(func.avg(Ticket.csat_score)).filter(Ticket.csat_score != None).scalar()
    avg_csat = round(float(csat_result), 2) if csat_result else None

    # SLA ihlali sayısı (aktif biletler için)
    from sqlalchemy import and_
    sla_breached = query.filter(
        and_(
            Ticket.due_at != None,
            Ticket.due_at < now,
            Ticket.status.notin_([TicketStatus.RESOLVED, TicketStatus.CLOSED])
        )
    ).count()

    return AnalyticsSummary(
        total_tickets=total,
        open_tickets=open_count,
        in_progress_tickets=in_progress,
        resolved_tickets=resolved,
        closed_tickets=closed,
        avg_csat_score=avg_csat,
        sla_breached_count=sla_breached
    )

@router.get("/departments", response_model=List[DepartmentDistribution])
def get_department_distribution(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Herkes analytics görebilir
    results = (
        db.query(Department.name, func.count(Ticket.id))
        .outerjoin(Ticket, Ticket.department_id == Department.id)
        .group_by(Department.id)
        .all()
    )

    return [DepartmentDistribution(name=row[0], count=row[1]) for row in results]

@router.get("/trend", response_model=List[DailyTrend])
def get_ticket_trend(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Herkes analytics görebilir
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # Tüm biletleri çekip Python'da gruplamak (SQLite uyumluluğu için en güvenlisi)
    tickets = db.query(Ticket).filter(Ticket.created_at >= thirty_days_ago).all()
    
    trend_dict = {}
    
    # Son 30 günü sıfırlarla başlat
    for i in range(30, -1, -1):
        date_str = (datetime.utcnow() - timedelta(days=i)).strftime('%Y-%m-%d')
        trend_dict[date_str] = {"total": 0, "resolved": 0}

    for t in tickets:
        if t.created_at:
            date_str = t.created_at.strftime('%Y-%m-%d')
            if date_str in trend_dict:
                trend_dict[date_str]["total"] += 1
                if t.status in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
                    trend_dict[date_str]["resolved"] += 1

    # Liste haline getir
    result = []
    for date, counts in trend_dict.items():
        result.append(DailyTrend(date=date, total=counts["total"], resolved=counts["resolved"]))
        
    return result
