import os
import sys
import random
from faker import Faker

# Add the root directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.category import Category, PriorityLevel
from app.models.ticket import Ticket, TicketStatus
from app.models.article import Article
from app.models.event import EventLog

def reset_db():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    fake = Faker('tr_TR')

    try:
        print("1. Creating Departments...")
        departments_data = [
            {"name": "Backend Team", "description": "Sunucu tarafı geliştirme ve veritabanı yönetimi"},
            {"name": "Frontend Team", "description": "Kullanıcı arayüzü ve deneyimi"},
            {"name": "QA & Testing", "description": "Kalite güvence ve yazılım testi"},
            {"name": "DevOps", "description": "Altyapı, CI/CD ve sistem yönetimi"},
            {"name": "Product Management", "description": "Ürün yönetimi ve iş analizi"}
        ]
        
        depts = []
        for d in departments_data:
            dept = Department(**d)
            db.add(dept)
            db.commit()
            db.refresh(dept)
            depts.append(dept)

        print("2. Creating Categories...")
        categories_data = [
            {"name": "API Hatası / Bug", "department_id": depts[0].id, "default_priority": PriorityLevel.HIGH},
            {"name": "Veritabanı Optimizasyonu", "department_id": depts[0].id, "default_priority": PriorityLevel.MEDIUM},
            {"name": "UI Kırılması", "department_id": depts[1].id, "default_priority": PriorityLevel.HIGH},
            {"name": "Responsive Tasarım Sorunu", "department_id": depts[1].id, "default_priority": PriorityLevel.MEDIUM},
            {"name": "Test Senaryosu Eksikliği", "department_id": depts[2].id, "default_priority": PriorityLevel.MEDIUM},
            {"name": "Production Hata Tespiti", "department_id": depts[2].id, "default_priority": PriorityLevel.HIGH},
            {"name": "CI/CD Pipeline Çökmesi", "department_id": depts[3].id, "default_priority": PriorityLevel.HIGH},
            {"name": "Sunucu Kaynak Tüketimi", "department_id": depts[3].id, "default_priority": PriorityLevel.HIGH},
            {"name": "Yeni Özellik Talebi", "department_id": depts[4].id, "default_priority": PriorityLevel.LOW},
            {"name": "Sprint Planlama", "department_id": depts[4].id, "default_priority": PriorityLevel.LOW},
        ]

        cats = []
        for c in categories_data:
            cat = Category(**c)
            db.add(cat)
            db.commit()
            db.refresh(cat)
            cats.append(cat)

        print("3. Creating Admin User...")
        admin_user = User(
            email="emreeken486@gmail.com",
            full_name="Emre Eken",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)

        print("Creating 2 Support Users...")
        support_users = []
        for i in range(2):
            support_user = User(
                email=f"support{i+1}@yazilimsirketi.com",
                full_name=f"Destek Personeli {i+1}",
                role=UserRole.SUPPORT_AGENT,
                is_active=True
            )
            db.add(support_user)
            support_users.append(support_user)

        print("4. Creating 20 random software professionals...")
        software_roles = [
            UserRole.BACKEND_DEV,
            UserRole.FRONTEND_DEV,
            UserRole.SCRUM_MASTER,
            UserRole.TESTER,
            UserRole.DEVOPS,
            UserRole.PRODUCT_OWNER
        ]
        
        users = [admin_user] + support_users
        
        for _ in range(20):
            email = fake.unique.email()
            username = email.split('@')[0]
            company_email = f"{username}@yazilimsirketi.com"
            
            random_role = random.choice(software_roles)
            
            # Map role to a likely department
            dept_map = {
                UserRole.BACKEND_DEV: depts[0].id,
                UserRole.FRONTEND_DEV: depts[1].id,
                UserRole.TESTER: depts[2].id,
                UserRole.DEVOPS: depts[3].id,
                UserRole.PRODUCT_OWNER: depts[4].id,
                UserRole.SCRUM_MASTER: depts[4].id
            }
            
            user = User(
                email=company_email,
                full_name=fake.name(),
                role=random_role,
                department_id=dept_map.get(random_role),
                is_active=True
            )
            db.add(user)
            users.append(user)
            
        db.commit()

        print("Database seeded successfully! (1 admin, 20 random software staff)")

    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_db()
