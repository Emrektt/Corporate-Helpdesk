# MVP Kapsamı (Scope)

Aşağıdaki özellikler, 3 haftalık (15 günlük) MVP (Minimum Viable Product - Minimum Uygulanabilir Ürün) süreci içerisinde tamamlanacak olan özellikleri ve kapsam dışı bırakılan geliştirme adımlarını listelemektedir.

## Kapsam Dahilindeki Özellikler

### Kullanıcı İşlemleri
*   Microsoft şirket hesabıyla (MSAL) giriş/çıkış işlemleri.

### Çalışan İşlemleri (Employee)
*   Yeni destek talebi oluşturabilme (Kategori, departman ve öncelik seçimi).
*   Kendi açtığı talepleri listeleme, durumlarını ve detaylarını görüntüleme.
*   Kendi taleplerine yorum ekleyebilme.
*   Uygulama içi bildirimleri okuyabilme.

### Destek Personeli İşlemleri (Support Agent)
*   Yalnızca kendi departmanına atanmış destek taleplerini görüntüleme.
*   Bir talebi kendi üzerine alma (Assign) veya başka bir destek personeline atama.
*   Talep durumunu (Örn: Bekliyor, Çözüldü) veya önceliğini değiştirme.
*   Taleplere kullanıcıya açık veya sadece departman içi görünecek şekilde dahili yorum (Internal Note) ekleme.
*   Talebi çözüldü olarak işaretleme.

### Admin İşlemleri
*   Sistemdeki kullanıcıları listeleme ve bu kullanıcıların rollerini (Admin, Support Agent, Employee) değiştirme.
*   Departmanları ve alt kategorileri yönetme (Oluşturma, aktifleştirme, pasifleştirme).
*   Sistemdeki tüm destek taleplerini listeleme.
*   Basit düzeyde metriklerin bulunduğu Dashboard ekranını (Toplam açılan, çözülen, geciken talepler) görüntüleme.

---

## Kapsam Dışındaki Özellikler (2. Sürüm / V2)

Aşağıdaki özellikler 3 haftalık MVP kapsamının **dışında** tutulmuştur:
*   Kullanıcıların profil fotoğrafını yüklemesi veya Microsoft Graph'ten çekilmesi.
*   Kullanıcı departman veya yönetici bilgilerinin Microsoft Graph ile senkronizasyonu.
*   Destek taleplerine dosya, resim veya belge eklenmesi (Dosyaların Azure Blob Storage veya MinIO ile saklanması).
*   SMTP entegrasyonu ile e-posta bildirimlerinin gönderilmesi.
*   Gelişmiş Redis Cache yapıları ve arka plan iş kuyrukları (Rate limiting hariç).
