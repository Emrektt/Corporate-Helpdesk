from app.core.database import SessionLocal
from app.models.article import Article

def seed_articles():
    db = SessionLocal()
    
    articles_data = [
        # IT Articles
        {
            "title": "VPN Bağlantı Sorunu Çözümü",
            "content": "Şirket dışından ağa bağlanırken VPN hatası alıyorsanız:\n\n1. FortiClient uygulamasını tamamen kapatın.\n2. İnternet bağlantınızı kontrol edip modeminizi yeniden başlatın.\n3. Uygulamayı yönetici olarak çalıştırın.\n4. Kullanıcı adı olarak e-posta adresinizin @ işaretinden önceki kısmını girin.\n5. Hata devam ederse şifrenizi portal üzerinden sıfırlayın.",
            "department_id": 1,
            "created_by_id": 1,
            "is_published": True
        },
        {
            "title": "Yazıcıdan Çıktı Alamıyorum (Offline Hatası)",
            "content": "Eğer yazıcı bilgisayarınızda 'Çevrimdışı' veya 'Offline' görünüyorsa:\n\n1. Yazıcının açık olduğundan ve ağ kablosunun takılı olduğundan emin olun.\n2. Başlat menüsünden 'Yazıcılar ve Tarayıcılar' sekmesine gidin.\n3. Şirket yazıcısını seçip 'Kuyruğu Aç' deyin.\n4. Üst menüden Yazıcı -> 'Çevrimdışı Kullan' seçeneğindeki tiki kaldırın.\n5. Belgeleri iptal edip tekrar yazdırmayı deneyin.",
            "department_id": 1,
            "created_by_id": 1,
            "is_published": True
        },
        {
            "title": "E-Posta (Outlook) Şifremi Unuttum",
            "content": "Outlook veya Office 365 şifrenizi unuttuysanız:\n\n1. portal.office.com adresine gidin.\n2. 'Şifremi unuttum' linkine tıklayın.\n3. Sistemde kayıtlı olan ikincil e-posta adresinize veya cep telefonunuza gelen doğrulama kodunu girin.\n4. Yeni şifrenizi belirleyin.\nNOT: Yeni şifreniz bilgisayar açılış şifrenizi DEĞİŞTİRMEZ.",
            "department_id": 1,
            "created_by_id": 2,
            "is_published": True
        },
        # HR Articles
        {
            "title": "Yıllık İzin Nasıl Talep Edilir?",
            "content": "Yıllık izin talepleri artık IK portalı üzerinden yapılmaktadır.\n\n1. hr.sirket.com adresine giriş yapın.\n2. Sol menüden 'İzinlerim' sekmesine tıklayın.\n3. 'Yeni İzin Talebi' butonuna basın.\n4. İzin türünü (Yıllık İzin) seçin ve tarihleri belirleyin.\n5. Yöneticinizin onayından sonra izin formunun çıktısını alıp ıslak imza ile IK departmanına teslim edin.",
            "department_id": 2,
            "created_by_id": 3,
            "is_published": True
        },
        {
            "title": "Maaş Bordrosunu Görüntüleme",
            "content": "Aylık maaş bordrolarınızı e-devlet üzerinden veya şirket içi sistemden görebilirsiniz:\n\nŞirket içi sistem için:\n1. Bordo portalına giriş yapın.\n2. Sicil numaranız ve TC kimlik numaranızın son 4 hanesi ile giriş yapın.\n3. İlgili ayı seçip PDF olarak indirebilirsiniz.",
            "department_id": 2,
            "created_by_id": 3,
            "is_published": True
        },
        # Finance Articles
        {
            "title": "Masraf Formu Doldurma Kılavuzu",
            "content": "Aylık şirket harcamalarınızı ve masraflarınızı beyan etmek için:\n\n1. Finans portalından 'Masraf Formu Taslağı' Excel dosyasını indirin.\n2. Fiş ve fatura numaralarını ilgili alanlara girin.\n3. Fişleri A4 kağıdına tarih sırasına göre yapıştırın.\n4. Masraf formunun çıktısını alarak imzalayın ve yöneticinize onaylatın.\n5. Islak imzalı evrakları her ayın 5'ine kadar Finans departmanına elden teslim edin.",
            "department_id": 3,
            "created_by_id": 1,
            "is_published": True
        }
    ]

    count = 0
    for data in articles_data:
        # Check if already exists
        exists = db.query(Article).filter(Article.title == data["title"]).first()
        if not exists:
            article = Article(**data)
            db.add(article)
            count += 1
            
    db.commit()
    print(f"{count} adet makale başarıyla eklendi!")

if __name__ == "__main__":
    seed_articles()
