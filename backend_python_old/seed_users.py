import sys
import os
import random
from faker import Faker
from sqlalchemy import text
from app.core.database import SessionLocal
from app.models.user import User, UserRole

def seed_users():
    db = SessionLocal()
    fake = Faker('tr_TR')

    try:
        print("Cleaning up database (TRUNCATE users CASCADE)...")
        # CASCADE ile users tablosunu silerken buna bağlı olan tüm ticket, yorum vb. de silinir
        db.execute(text("TRUNCATE TABLE users CASCADE;"))
        db.commit()

        print("Creating admin user...")
        admin_user = User(
            email="emreeken486@gmail.com",
            full_name="Emre Eken",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)

        print("Creating 20 random users...")
        software_roles = [
            UserRole.BACKEND_DEV,
            UserRole.FRONTEND_DEV,
            UserRole.SCRUM_MASTER,
            UserRole.TESTER,
            UserRole.DEVOPS,
            UserRole.PRODUCT_OWNER
        ]
        for _ in range(20):
            email = fake.unique.email()
            # Şirket e-postasına çevirelim
            username = email.split('@')[0]
            company_email = f"{username}@sirketadi.com"
            
            random_role = random.choice(software_roles)
            
            user = User(
                email=company_email,
                full_name=fake.name(),
                role=random_role,
                is_active=True
            )
            db.add(user)

        db.commit()
        print("Database seeded successfully! (1 admin, 20 random employees)")

    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
