# Corporate Helpdesk

Şirket çalışanlarının IT, insan kaynakları, finans, satın alma ve idari işler taleplerini oluşturabileceği; ilgili departmanların bu talepleri yönetebileceği kurumsal destek uygulaması.

## Kullanılan Teknolojiler

*   **Frontend:** React, TypeScript, Vite, Tailwind CSS, MSAL React
*   **Backend:** Python 3.12+, FastAPI, SQLAlchemy 2, PostgreSQL
*   **Authentication:** Microsoft Entra ID (MSAL)
*   **DevOps:** Docker, Docker Compose, GitHub Actions

## Proje Amacı

Bu proje, şirket içi destek taleplerinin (ticket) tek bir merkezden yönetilmesini sağlamayı amaçlar. Çalışanlar Microsoft hesaplarıyla giriş yaparak destek talebi oluşturabilir, destek personeli ise bu talepleri ilgili departman bazında takip edip çözüme kavuşturabilir.

## Test Altyapısı ve Testleri Çalıştırma

Projeye kod kalitesini artırmak ve yeni eklenecek özelliklerin mevcut yapıyı bozmadığından emin olmak için üç farklı test katmanı entegre edilmiştir.

### 1. Backend Unit Testleri (Pytest)
Backend API'sinin, bilet yönetiminin, SLA (Hizmet Seviyesi Sözleşmesi) ve CSAT (Müşteri Memnuniyeti) modüllerinin çalıştığını doğrulayan testlerdir.
Testleri Docker üzerinden çalıştırmak için ana dizinde şu komutu kullanabilirsiniz:
```bash
docker compose run --rm backend pytest
```

### 2. Frontend Unit Testleri (Vitest & React Testing Library)
React bileşenlerinin (Örn: Sidebar, Dashboard, Live Chat) render durumlarını, pagination (sayfalama) state'lerini ve admin kontrollerini simüle ederek doğrulayan testlerdir.
Testleri frontend klasöründe veya Docker üzerinden şu komutla çalıştırabilirsiniz:
```bash
# Sadece frontend testlerini çalıştırmak için
docker run --rm -v $(pwd)/frontend:/app -w /app node:20-alpine npm run test
```

### 3. E2E (Uçtan Uca) Testler (Playwright)
Kullanıcının gerçek bir tarayıcı ortamında (Chromium, Firefox vb.) uygulamaya girip butona tıklaması gibi uçtan uca akışları (Login dahil) test ettiğimiz yapıdır. Testler `e2e` klasöründe yer alır.
E2E testlerini çalıştırmak için `e2e` klasörüne girip şu komutu kullanabilirsiniz:
```bash
cd e2e
npx playwright test
```
*(Playwright test raporlarını görsel olarak görmek isterseniz `npx playwright test --ui` komutunu kullanabilirsiniz.)*
