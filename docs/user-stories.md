# Kullanıcı Senaryoları (User Stories)

Aşağıdaki hikayeler uygulamanın üç ana rolüne (Çalışan, Destek Personeli, Admin) göre hazırlanmıştır. Toplam 10 kullanıcı hikayesi ve bunların kabul kriterleri listelenmiştir.

### 1. Çalışan (Employee) Girişi
**Hikaye:** Bir çalışan olarak sisteme mevcut Microsoft şirket hesabımla giriş yapabilmeliyim; böylece yeni bir şifre ezberlemek veya kayıt olmak zorunda kalmam.
**Kabul Kriterleri:**
* Kullanıcı giriş butonuna tıkladığında Microsoft login sayfasına yönlendirilmelidir.
* Başarılı giriş sonrasında kullanıcı dashboard'una yönlendirilmelidir.
* Microsoft tenant'ında bulunmayan dış kullanıcıların erişimi engellenmelidir.

### 2. Çalışan (Employee) - Yeni Talep Oluşturma
**Hikaye:** Bir çalışan olarak departman, kategori, başlık ve içerik belirterek yeni bir destek talebi oluşturabilmeliyim; böylece ilgili departmana sorunumu iletebilirim.
**Kabul Kriterleri:**
* Formda departman ve kategori alanları birbiriyle bağlantılı çalışmalı (Departman seçince ona uygun kategoriler gelmeli).
* Başlık zorunlu olmalı ve açıklama en az 20 karakter uzunluğunda olmalıdır.
* Başarılı kayıt sonrası "TCK-YYYY-XXXXXX" formatında otomatik bir talep numarası oluşturulmalıdır.

### 3. Çalışan (Employee) - Kendi Taleplerini Listeleme
**Hikaye:** Bir çalışan olarak daha önce açtığım tüm taleplerin bir listesini görüntüleyebilmeliyim; böylece hangi durumunda olduklarını takip edebilirim.
**Kabul Kriterleri:**
* Sadece kullanıcının kendi açtığı kayıtlar listelenmelidir.
* Durum (Açık, Beklemede, Çözüldü vb.) bilgisi tabloda net olarak görünmelidir.
* Son güncellenme tarihine göre sıralı olmalıdır.

### 4. Çalışan (Employee) - Talebe Yorum Ekleme
**Hikaye:** Bir çalışan olarak, daha önce açtığım bir destek talebine yeni bir yorum ekleyebilmeliyim; böylece destek personeline ek bilgi sunabilirim.
**Kabul Kriterleri:**
* Talep detay sayfasında yorum yazma alanı bulunmalıdır.
* Gönderilen yorum talep geçmişinde (timeline) tarih ve saat ile birlikte listelenmelidir.
* Kapatılmış veya çözülmüş bir talebe yeni yorum eklenememelidir (İsteğe bağlı kural).

### 5. Destek Personeli (Support Agent) - Talepleri Görüntüleme
**Hikaye:** Bir destek personeli olarak, sadece bağlı olduğum departmana (örn. IT) gelen taleplerin listesini görebilmeliyim; böylece diğer departmanların işleri ile karışıklık yaşamam.
**Kabul Kriterleri:**
* Support Agent rolündeki bir kullanıcı giriş yaptığında yalnızca kendi departmanının kayıtları getirilmelidir.
* Öncelik (Kritik, Yüksek vb.) filtreleme seçeneği çalışmalıdır.

### 6. Destek Personeli (Support Agent) - Talebi Üzerine Alma
**Hikaye:** Bir destek personeli olarak departmanıma gelen sahipsiz bir destek talebini kendi üzerime (assign) alabilmeliyim; böylece çalışan kiminle muhatap olduğunu görebilir.
**Kabul Kriterleri:**
* Atanmamış bir kayıtta "Üzerime Al" butonu görünmelidir.
* İşlem sonrasında talep durumu "Açık" konumundan "İşlemde (In Progress)" konumuna geçmelidir.
* Çalışana durum değişikliği ile ilgili bildirim oluşturulmalıdır.

### 7. Destek Personeli (Support Agent) - Dahili Yorum (Internal Note)
**Hikaye:** Bir destek personeli olarak bir talebe "Dahili Yorum" ekleyebilmeliyim; böylece destek talep sahibi (çalışan) görmeden diğer takım arkadaşlarımla not paylaşabilirim.
**Kabul Kriterleri:**
* Yorum ekleme kutusunda "Dahili Yorum (Internal)" şeklinde bir checkbox bulunmalıdır.
* Eklenen dahili yorumlar, sadece Admin ve Support Agent rollerine gösterilmeli, Employee'ye gösterilmemelidir.

### 8. Destek Personeli (Support Agent) - Talep Kapatma
**Hikaye:** Bir destek personeli olarak, ilgilendiğim problemi çözdükten sonra talebin durumunu "Çözüldü" olarak işaretleyebilmeliyim; böylece süreç sonlanabilir.
**Kabul Kriterleri:**
* Talep durumu güncelleme alanında "Çözüldü (Resolved)" seçeneği bulunmalıdır.
* Çözüldü durumuna alınan bir talebin "resolved_at" tarihi veritabanında saklanmalıdır.

### 9. Admin - Kullanıcı Rollerini Yönetme
**Hikaye:** Bir Admin olarak sistemdeki bir çalışanı "Support Agent" veya "Admin" olarak yetkilendirebilmeliyim; böylece ekibe yeni katılan destek uzmanlarına gerekli izni verebilirim.
**Kabul Kriterleri:**
* Kullanıcı listesi sayfasında kullanıcıların rolleri güncellenebilmelidir.
* Backend, rolü değiştirmeye çalışan kişinin gerçekten Admin olduğunu kontrol etmelidir.

### 10. Admin - Departman ve Kategori Yönetimi
**Hikaye:** Bir Admin olarak sisteme yeni bir departman (örn. Satın Alma) ve ona ait kategoriler (örn. Bilgisayar Alımı) ekleyebilmeliyim; böylece sistem yeni ihtiyaçlara göre genişleyebilir.
**Kabul Kriterleri:**
* Yeni departman oluşturulabilmelidir.
* Belirli bir departmana ait yeni kategori oluşturulabilmelidir.
* Kullanılmayan departman/kategoriler sistemden kalıcı olarak silinmek yerine "Aktif değil (is_active=false)" olarak işaretlenebilmelidir.
