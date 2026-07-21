# Corporate Helpdesk - Veritabanı Yapısı ve Tutulan Bilgiler

Bu belge, sistemin veritabanında (PostgreSQL) hangi verilerin tutulduğunu ve bu verilerin birbirleriyle nasıl bir ilişki içinde olduğunu açıklar.

## 1. Kullanıcılar ve Roller (Users)
Sisteme giriş yapan herkesin temel bilgileri bu tabloda tutulur.
*   **Kişisel Bilgiler:** Ad, soyad, e-posta adresi.
*   **Yetki Rolleri:** Kullanıcının sistemdeki konumu (`ADMIN`, `AGENT` veya `EMPLOYEE`).
*   **Departman İlişkisi:** Eğer kullanıcı bir destek personeli (`AGENT`) ise hangi departmana (IT, İK, Finans vb.) bağlı olduğu.
*   **Durum:** Hesabın aktif olup olmadığı.
*   **Microsoft Entra (Azure AD):** Şirket içi Microsoft hesaplarıyla eşleşmeyi sağlayan benzersiz kimlik (Tenant/Object ID vb.).

## 2. Departmanlar ve Kategoriler (Departments & Categories)
Biletlerin doğru ekiplere yönlendirilmesini sağlayan yapı taşıdır.
*   **Departmanlar:** IT, İnsan Kaynakları, İdari İşler gibi ana departmanların isimleri ve açıklamaları.
*   **Kategoriler:** Bir departmanın altındaki spesifik destek konuları. Örneğin; IT departmanının altında "Donanım", "Yazılım", "Ağ Sorunları" gibi kategoriler.
*   **Varsayılan Öncelik:** Bir kategori seçildiğinde biletin otomatik olarak hangi aciliyet seviyesinde (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) açılacağını belirleyen kurallar.

## 3. Destek Talepleri (Tickets)
Kullanıcıların oluşturduğu ana yardım talepleridir. Veritabanının en yoğun kullanılan bölümüdür.
*   **Temel Bilgiler:** Biletin başlığı, detaylı açıklaması ve sistem tarafından otomatik atanan bilet numarası.
*   **Durum (Status):** Biletin mevcut durumu (`AÇIK`, `İŞLEMDE`, `ÇÖZÜLDÜ`, `KAPATILDI`).
*   **Öncelik (Priority):** Talebin aciliyet seviyesi.
*   **İlişkiler:**
    *   Bileti açan kişi (Kim talep etti?)
    *   İlgili kategori ve departman.
    *   Atanan personel (Hangi ajan bu biletle ilgileniyor?)
*   **SLA (Hizmet Seviyesi Sözleşmesi):** Talebin ne zaman yanıtlandığı, ne zaman çözüldüğü ve gecikme (SLA ihlali) olup olmadığı bilgisi.
*   **CSAT (Müşteri Memnuniyeti):** Bilet çözüldükten sonra kullanıcının verdiği 1-5 arası yıldız puanı ve yazdığı geribildirim yorumu.

## 4. Bilet Yorumları ve Dosyalar (Ticket Comments & Attachments)
Bir biletin içindeki yazışmalar ve paylaşılan medyalar bu tablolarda tutulur.
*   **Yorumlar:** Bilet içine yazılan mesajlar, gönderim tarihi ve gönderen kişi. (Destek ekibinin kendi arasında yazıştığı ancak kullanıcıların göremediği *'Gizli/İç Notlar'* da burada özel bir işaretle tutulur.)
*   **Ekler (Attachments):** Kullanıcıların veya personelin bilete yüklediği ekran görüntüleri, PDF'ler veya dokümanların dosya yolları ve türleri.

## 5. Bilet Geçmişi (Ticket History / Audit Trail)
Bir bilet üzerinde yapılan tüm değişikliklerin anbean kaydedildiği günlüktür.
*   **Aksiyon Tipi:** Biletin oluşturulması, durumunun değiştirilmesi, başkasına atanması, önceliğinin yükseltilmesi gibi işlemler.
*   **Kim Yaptı:** Bu değişikliği hangi kullanıcının yaptığı.
*   **Eski ve Yeni Değerler:** Değişiklikten önceki durum ve değişiklikten sonraki durum (Örn: Durum "Açık"tan "İşlemde"ye alındı).

## 6. Bilgi Bankası Makaleleri (Articles)
Sık sorulan sorular ve rehberlerin tutulduğu bölümdür.
*   **İçerik:** Makale başlığı, detaylı HTML/Markdown içeriği.
*   **Kategorizasyon:** Makalenin hangi departman veya kategoriyle ilgili olduğu.
*   **Görüntülenme:** Makalenin kullanıcılar tarafından kaç kez okunduğu.

## 7. Canlı Destek Sistemi (Chat & Messages)
Eş zamanlı mesajlaşma altyapısıdır.
*   **Sohbet Odaları (Chat Rooms):** Hangi kullanıcının hangi destek personeli ile konuştuğu ve bu odanın aktif olup olmadığı.
*   **Sohbet Mesajları:** Odanın içindeki anlık yazışmalar, gönderim zamanları ve okundu bilgileri.

## 8. Bildirimler ve Olay Logları (Notifications & Event Logs)
Sistemdeki hareketlilikleri takip eden modüllerdir.
*   **Bildirimler:** "Biletinize yeni yorum yapıldı", "Yeni bir bilet size atandı" gibi kullanıcılara sistem içi giden bildirimlerin metni, tarihi ve okunma durumu.
*   **Olay Logları (Event Log):** Sisteme kimin, saat kaçta, hangi IP adresi ve hangi tarayıcı ile giriş yaptığı gibi genel güvenlik ve denetim kayıtları.

## 9. Hazır Yanıtlar (Canned Responses)
Destek personelinin sık sorulan sorulara hızlıca cevap verebilmesi için oluşturduğu metin şablonlarıdır. Şablonun başlığı, içerik metni ve bunu oluşturan personelin bilgisi tutulur.
