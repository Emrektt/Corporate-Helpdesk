from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.category import Category, PriorityLevel

def seed_data(db: Session):
    # 1. Departmanları Ekle
    departments_data = [
        {"name": "IT", "description": "Bilgi Teknolojileri"},
        {"name": "İnsan Kaynakları", "description": "Personel işlemleri ve işe alım"},
        {"name": "Finans", "description": "Muhasebe ve gider yönetimi"},
        {"name": "Satın Alma", "description": "Şirket içi donanım ve lisans alımları"},
        {"name": "İdari İşler", "description": "Bina yönetimi ve ofis ihtiyaçları"}
    ]
    
    depts = []
    for d in departments_data:
        dept = db.query(Department).filter(Department.name == d["name"]).first()
        if not dept:
            dept = Department(**d)
            db.add(dept)
            db.commit()
            db.refresh(dept)
        depts.append(dept)

    # 2. Kategorileri Ekle (10 Adet)
    categories_data = [
        {"name": "Donanım Arızası", "department_id": depts[0].id, "default_priority": PriorityLevel.HIGH},
        {"name": "Yazılım/Erişim Sorunu", "department_id": depts[0].id, "default_priority": PriorityLevel.MEDIUM},
        {"name": "İşe Alım Talebi", "department_id": depts[1].id, "default_priority": PriorityLevel.MEDIUM},
        {"name": "İzin/Rapor Bildirimi", "department_id": depts[1].id, "default_priority": PriorityLevel.LOW},
        {"name": "Bordro/Maaş Sorunu", "department_id": depts[2].id, "default_priority": PriorityLevel.HIGH},
        {"name": "Masraf Beyanı", "department_id": depts[2].id, "default_priority": PriorityLevel.LOW},
        {"name": "Yeni Bilgisayar Talebi", "department_id": depts[3].id, "default_priority": PriorityLevel.MEDIUM},
        {"name": "Lisans/Yazılım Alımı", "department_id": depts[3].id, "default_priority": PriorityLevel.LOW},
        {"name": "Ofis Malzemesi İhtiyacı", "department_id": depts[4].id, "default_priority": PriorityLevel.LOW},
        {"name": "Bina İçi Teknik Arıza", "department_id": depts[4].id, "default_priority": PriorityLevel.HIGH},
    ]

    for c in categories_data:
        cat = db.query(Category).filter(Category.name == c["name"]).first()
        if not cat:
            cat = Category(**c)
            db.add(cat)
            db.commit()

    # 3. Kullanıcıları Ekle (1 Admin, 2 Destek, 3 Çalışan)
    users_data = [
        {"email": "admin@sirketadi.com", "full_name": "Sistem Yöneticisi", "role": UserRole.ADMIN, "department_id": depts[0].id},
        {"email": "it.destek@sirketadi.com", "full_name": "IT Destek Uzmanı", "role": UserRole.SUPPORT_AGENT, "department_id": depts[0].id},
        {"email": "ik.destek@sirketadi.com", "full_name": "İnsan Kaynakları Uzmanı", "role": UserRole.SUPPORT_AGENT, "department_id": depts[1].id},
        {"email": "calisan1@sirketadi.com", "full_name": "Ahmet Yılmaz", "role": UserRole.EMPLOYEE, "department_id": depts[2].id},
        {"email": "calisan2@sirketadi.com", "full_name": "Ayşe Demir", "role": UserRole.EMPLOYEE, "department_id": depts[3].id},
        {"email": "calisan3@sirketadi.com", "full_name": "Mehmet Çelik", "role": UserRole.EMPLOYEE, "department_id": depts[4].id},
    ]

    for u in users_data:
        user = db.query(User).filter(User.email == u["email"]).first()
        if not user:
            user = User(**u)
            db.add(user)
            db.commit()

    print("✅ Örnek veriler (Seed Data) başarıyla yüklendi!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
