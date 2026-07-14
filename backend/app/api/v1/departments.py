from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.department import Department
from app.models.category import Category
from app.models.ticket import Ticket
from app.schemas.department import DepartmentWithCategories, DepartmentCreate, DepartmentUpdate, CategoryCreate, CategoryBase
from app.models.user import User, UserRole
from app.api.dependencies import get_current_user

router = APIRouter()

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Bu işlem için Admin yetkisi gereklidir")
    return current_user

@router.get("/", response_model=List[DepartmentWithCategories])
def get_departments(db: Session = Depends(get_db)):
    """Tüm departmanları ve altlarındaki kategorileri listeler"""
    return db.query(Department).all()

@router.post("/", response_model=DepartmentWithCategories, status_code=201)
def create_department(
    dept_in: DepartmentCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    new_dept = Department(name=dept_in.name)
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept

@router.put("/{dept_id}", response_model=DepartmentWithCategories)
def update_department(
    dept_id: int,
    dept_in: DepartmentUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Departman bulunamadı")
    dept.name = dept_in.name
    db.commit()
    db.refresh(dept)
    return dept

@router.delete("/{dept_id}")
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Departman bulunamadı")
    
    # Bilet kontrolü
    has_tickets = db.query(Ticket).filter(Ticket.department_id == dept_id).first()
    if has_tickets:
        raise HTTPException(status_code=400, detail="Bu departmana ait biletler bulunduğu için silinemez")
        
    db.delete(dept)
    db.commit()
    return {"message": "Departman silindi"}

@router.post("/categories", response_model=CategoryBase, status_code=201)
def create_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    dept = db.query(Department).filter(Department.id == cat_in.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Bağlı departman bulunamadı")

    new_cat = Category(
        name=cat_in.name,
        department_id=cat_in.department_id,
        default_priority=cat_in.default_priority
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@router.delete("/categories/{cat_id}")
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı")

    # Bilet kontrolü
    has_tickets = db.query(Ticket).filter(Ticket.category_id == cat_id).first()
    if has_tickets:
        raise HTTPException(status_code=400, detail="Bu kategoriye ait biletler bulunduğu için silinemez")

    db.delete(cat)
    db.commit()
    return {"message": "Kategori silindi"}
