# API Sözleşmesi (API Contract)

Bu belge, Frontend ile Backend arasında veri alışverişini sağlayacak olan HTTP endpoint'lerini listeler.
Tüm isteklerin `Authorization: Bearer <MSAL_ACCESS_TOKEN>` header'ı içermesi zorunludur (Health hariç).

## 1. Genel Sistem (Public/System)
*   **`GET /api/health`**
    *   Sistemin ve veritabanının ayakta olup olmadığını kontrol eder.

## 2. Kimlik Doğrulama ve Kullanıcı (Auth)
*   **`GET /api/auth/me`**
    *   Token'ı gönderen kullanıcının (Current User) veritabanındaki bilgilerini (ID, Rol, Departman) döner.
*   **`GET /api/auth/permissions`**
    *   Kullanıcının yapabileceği işlemlerin yetki listesini döner.

## 3. Çalışan İşlemleri (Employee & Tickets)
*   **`POST /api/tickets`**
    *   Yeni bir destek talebi oluşturur (Çalışanlar).
*   **`GET /api/tickets/mine`**
    *   Kullanıcının sadece kendi açtığı talepleri listeler (Filtreler: status, priority, category_id).
*   **`GET /api/tickets/{ticket_id}`**
    *   Bir talebin detaylarını (başlık, açıklama, oluşturan vs.) getirir.

## 4. Destek Personeli İşlemleri (Support)
*(Bu uç noktalara sadece ADMIN veya ilgili departmanın SUPPORT_AGENT yetkisine sahip kullanıcıları erişebilir)*
*   **`GET /api/support/tickets`**
    *   Destek personelinin kendi departmanına atanmış olan taleplerin listesini getirir.
*   **`POST /api/support/tickets/{id}/assign`**
    *   Talebi işlemi yapan personelin veya başka bir personelin üzerine atar.
*   **`PATCH /api/support/tickets/{id}/status`**
    *   Talebin durumunu günceller (Örn: Çözüldü).
*   **`PATCH /api/support/tickets/{id}/priority`**
    *   Talebin önceliğini günceller.

## 5. Yorum ve Tarihçe İşlemleri (Comments & History)
*   **`GET /api/tickets/{id}/comments`**
    *   Talebe ait yorumları listeler (Dahili yorumlar yetkiye göre filtrelenir).
*   **`POST /api/tickets/{id}/comments`**
    *   Talebe yeni bir yorum ekler.
*   **`GET /api/tickets/{id}/history`**
    *   Talebin tüm işlem geçmişini (durum değişikliği, atama vb.) listeler.

## 6. Bildirimler ve Raporlar (Notifications & Reports)
*   **`GET /api/notifications`**
    *   Kullanıcının bildirimlerini listeler.
*   **`PATCH /api/notifications/{id}/read`**
    *   Bildirimi okundu olarak işaretler.
*   **`PATCH /api/notifications/read-all`**
    *   Tüm bildirimleri okundu olarak işaretler.
*   **`GET /api/reports/summary`**
    *   Dashboard için özet verileri (Toplam açık talep, çözülen talep vb.) döner.

## 7. Yönetici Paneli (Admin)
*(Bu uç noktalara sadece ADMIN yetkisine sahip kullanıcılar erişebilir)*
*   **`GET /api/admin/users`**
    *   Tüm kullanıcıları listeler.
*   **`PATCH /api/admin/users/{id}/role`**
    *   Bir kullanıcının rolünü değiştirir.
*   **`GET /api/admin/departments`**
    *   Departman listesini getirir.
*   **`POST /api/admin/departments`**
    *   Yeni departman oluşturur.
*   **`PATCH /api/admin/departments/{id}`**
    *   Departman bilgilerini günceller.
*   **`GET /api/admin/categories`**
    *   Kategorileri listeler.
*   **`POST /api/admin/categories`**
    *   Yeni kategori oluşturur.
*   **`PATCH /api/admin/categories/{id}`**
    *   Kategori bilgilerini günceller.
