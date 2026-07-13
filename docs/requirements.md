# Gereksinimler (Requirements)

## Kullanıcı Rolleri

*   **ADMIN:** Sistemdeki tüm kullanıcıları görüntüleyebilir, kullanıcı rollerini yönetebilir, departman ve kategorileri düzenleyebilir, sistemdeki tüm taleplere erişebilir ve genel dashboard metriklerini görebilir.
*   **SUPPORT_AGENT (Destek Personeli):** Yalnızca kendi departmanına (örn. IT, HR) gelen talepleri görebilir. Talebi üzerine alabilir, başka bir personele atayabilir, talep durumunu veya önceliğini değiştirebilir. Kullanıcıya açık veya departman içi dahili (internal) yorum ekleyebilir.
*   **EMPLOYEE (Çalışan):** Yalnızca kendi oluşturduğu destek taleplerini görüntüleyebilir. Yeni destek talebi oluşturabilir, kendi taleplerine yorum ekleyebilir, talep durumunu takip edebilir.

## Temel Sistem Gereksinimleri

*   **Authentication:** Sistemin kendi şifre giriş ekranı olmayacaktır. Kullanıcılar yalnızca Microsoft şirket hesaplarıyla (Microsoft Entra ID) giriş yapacaktır.
*   **Yetkilendirme:** Frontend, alınan MSAL access token'ını Backend'e iletecek, Backend bu token'ın süresini, doğruluğunu ve rolünü kontrol ederek işlemlere izin verecektir.
*   **Veri Yönetimi:** Tüm operasyonel veriler ilişkisel bir veritabanı olan PostgreSQL'de tutulacaktır.
*   **Denetim İzi (Audit Logging):** Sistemdeki her işlem (Talep oluşturma, durum değiştirme, atama vb.) `ticket_history` adı altında veritabanına kayıt edilecek ve takip edilebilecektir.
