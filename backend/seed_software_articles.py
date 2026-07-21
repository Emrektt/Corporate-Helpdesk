from app.core.database import SessionLocal, engine, Base
from app.models.article import Article
from sqlalchemy.orm import Session
from sqlalchemy import text

def seed_software_articles():
    db = SessionLocal()
    
    # Optional: Clear existing articles
    db.execute(text("TRUNCATE TABLE articles CASCADE;"))
    db.commit()

    articles_data = [
        # Backend Team
        {
            "title": "Veritabanı Migrasyon Rehberi (Alembic)",
            "content": "Yeni bir veritabanı migrasyonu oluşturmak için:\n\n1. Modellerinizi app/models/ altında güncelleyin.\n2. Container içine girin: `docker exec -it helpdesk_backend bash`\n3. Migrasyon oluşturun: `alembic revision --autogenerate -m 'mesaj'`\n4. Veritabanına uygulayın: `alembic upgrade head`\n\nHer zaman staging ortamında test etmeyi unutmayın.",
            "department_id": 1,
            "created_by_id": 1,
            "is_published": True
        },
        {
            "title": "API Rate Limiting Limitleri",
            "content": "Production ortamında API rate limiting kuralları şu şekildedir:\n\n- Public Endpointler: 100 istek / dakika\n- Authenticated Endpointler: 1000 istek / dakika\n- Dosya Yükleme: 20 istek / dakika\n\nEğer bir müşterimiz için bu limitlerin artırılması gerekiyorsa, ticket açın.",
            "department_id": 1,
            "created_by_id": 1,
            "is_published": True
        },
        # Frontend Team
        {
            "title": "React Bileşen Standartları",
            "content": "Tüm yeni React bileşenleri için kurallarımız:\n\n1. Functional component ve Hooks kullanılmalıdır.\n2. Prop types yerine TypeScript Interface kullanılmalıdır.\n3. CSS modülleri yerine Styled Components veya Tailwind tercih edilmelidir.\n4. Her bileşenin kendi klasöründe `index.tsx` ve `ComponentName.test.tsx` dosyaları bulunmalıdır.",
            "department_id": 2,
            "created_by_id": 1,
            "is_published": True
        },
        {
            "title": "Vite Build Optimizasyonu",
            "content": "Frontend projesinde chunk boyutlarını küçültmek için:\n\n`vite.config.ts` dosyasında `manualChunks` konfigürasyonunu güncelleyin. Özellikle `react`, `react-dom` ve büyük kütüphaneleri (örn: `recharts`, `lucide-react`) ayrı chunk'lara ayırın.",
            "department_id": 2,
            "created_by_id": 1,
            "is_published": True
        },
        # QA & Testing
        {
            "title": "E2E Test Senaryosu Yazımı (Cypress)",
            "content": "Yeni özellikler için Cypress testi yazarken:\n\n1. Testler `cypress/e2e` dizinine eklenmelidir.\n2. `data-testid` attribute'u üzerinden seçim yapılmalıdır.\n3. Her test `beforeEach` içinde login işlemini gerçekleştirmelidir.\n4. Test verileri fixture'lardan okunmalıdır.",
            "department_id": 3,
            "created_by_id": 1,
            "is_published": True
        },
        # DevOps
        {
            "title": "Production Deployment Süreci",
            "content": "Canlı ortama kod çıkmak için izlenmesi gereken adımlar:\n\n1. `main` branch'ine açılan PR'ın en az 2 onay alması gereklidir.\n2. GitHub Actions üzerinde CI pipeline'ının (Lint, Test, Build) yeşil dönmesi şarttır.\n3. DevOps ekibi onay verdikten sonra `production` branch'ine merge edilir.\n4. CD pipeline'ı otomatik olarak AWS ECS'e deployment yapacaktır.",
            "department_id": 4,
            "created_by_id": 1,
            "is_published": True
        },
        # Product Management
        {
            "title": "Yeni Epic Açma Prosedürü",
            "content": "Jira'da yeni bir Epic oluştururken dikkat edilmesi gerekenler:\n\n- Epic adı anlaşılır olmalı (Örn: 'Kullanıcı Bildirim Merkezi').\n- Açıklama kısmında User Story'ler net bir şekilde listelenmeli.\n- Acceptance Criteria (Kabul Kriterleri) PO tarafından yazılmış olmalı.\n- İlgili tasarım (Figma) linkleri eklenmiş olmalıdır.",
            "department_id": 5,
            "created_by_id": 1,
            "is_published": True
        }
    ]

    for data in articles_data:
        article = Article(**data)
        db.add(article)
        
    db.commit()
    print(f"{len(articles_data)} adet yazılım ekibi makalesi başarıyla eklendi!")

if __name__ == "__main__":
    seed_software_articles()
