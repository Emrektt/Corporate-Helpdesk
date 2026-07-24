import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English translations
const resources = {
  en: {
    translation: {
      "sidebar": {
        "menu": "Menu",
        "dashboard": "Dashboard",
        "new_ticket": "New Ticket",
        "knowledge_base": "Knowledge Base",
        "reports": "Reports",
        "system_logs": "System Logs",
        "users": "Users",
        "settings": "Settings",
        "light_theme": "Light Theme",
        "dark_theme": "Dark Theme",
        "notifications": "Notifications",
        "mark_all_read": "Mark All Read",
        "no_notifications": "No notifications",
        "admin_mode": "Admin Mode",
        "user_mode": "User Mode",
        "switch_to_user": "Switch to user mode \u2192",
        "switch_to_admin": "\u2190 Back to admin mode",
        "logout": "Logout"
      },
      "settings": {
        "system_settings": "System Settings",
        "system_settings_desc": "Manage departments, categories, and user preferences.",
        "user_settings": "User Settings",
        "user_settings_desc": "Manage your personal preferences.",
        "tab_departments": "Departments & Categories",
        "tab_canned": "Canned Responses",
        "tab_preferences": "User Preferences (API)",
        "pref_title": "Personal Preferences",
        "pref_desc": "You can test the /api/v1/user-preferences/me API endpoint here.",
        "save_success": "Your preferences have been saved to the database successfully!",
        "email_notif": "Email Notifications",
        "email_notif_desc": "Receive emails for ticket status updates",
        "desktop_notif": "Desktop Notifications",
        "desktop_notif_desc": "Enable live browser notifications",
        "default_theme": "Default Theme",
        "default_theme_desc": "Select application color theme",
        "theme_system": "System Default",
        "theme_dark": "Dark Theme",
        "theme_light": "Light Theme",
        "ui_language": "Interface Language",
        "ui_language_desc": "Your preferred default language",
        "lang_tr": "Turkish (TR)",
        "lang_en": "English (EN)"
      }
    }
  },
  tr: {
    translation: {
      "sidebar": {
        "menu": "Men\u00fc",
        "dashboard": "Dashboard",
        "new_ticket": "Yeni Talep",
        "knowledge_base": "Bilgi Bankas\u0131",
        "reports": "Raporlar",
        "system_logs": "Sistem Loglar\u0131",
        "users": "Kullan\u0131c\u0131lar",
        "settings": "Ayarlar",
        "light_theme": "Ayd\u0131nl\u0131k Tema",
        "dark_theme": "Karanl\u0131k Tema",
        "notifications": "Bildirimler",
        "mark_all_read": "T\u00fcm\u00fcn\u00fc Oku",
        "no_notifications": "Bildirim yok",
        "admin_mode": "Admin Modu",
        "user_mode": "Kullan\u0131c\u0131 Modu",
        "switch_to_user": "Kullan\u0131c\u0131 moduna ge\u00e7 \u2192",
        "switch_to_admin": "\u2190 Admin moduna d\u00f6n",
        "logout": "\u00c7\u0131k\u0131\u015f Yap"
      },
      "settings": {
        "system_settings": "Sistem Ayarlar\u0131",
        "system_settings_desc": "Departmanlar, kategoriler ve kullan\u0131c\u0131 tercihlerini y\u00f6netin.",
        "user_settings": "Kullan\u0131c\u0131 Ayarlar\u0131",
        "user_settings_desc": "Ki\u015fisel tercihlerinizi y\u00f6netin.",
        "tab_departments": "Departmanlar & Kategoriler",
        "tab_canned": "Haz\u0131r Cevaplar",
        "tab_preferences": "Kullan\u0131c\u0131 Tercihleri (API)",
        "pref_title": "Ki\u015fisel Tercihler",
        "pref_desc": "Yeni ekledi\u011fimiz /api/v1/user-preferences/me API u\u00e7 noktas\u0131n\u0131 canl\u0131 olarak buradan test edebilirsiniz.",
        "save_success": "Tercihleriniz veritaban\u0131na ba\u015far\u0131yla kaydedildi!",
        "email_notif": "E-posta Bildirimleri",
        "email_notif_desc": "Bilet durum g\u00fcncellemelerinde e-posta al",
        "desktop_notif": "Masa\u00fcst\u00fc Bildirimleri",
        "desktop_notif_desc": "Taray\u0131c\u0131 i\u00e7i canl\u0131 anl\u0131k bildirimleri aktif et",
        "default_theme": "Varsay\u0131lan Tema",
        "default_theme_desc": "Uygulama renk temas\u0131 se\u00e7imi",
        "theme_system": "Sistem Varsay\u0131lan\u0131",
        "theme_dark": "Koyu Tema (Dark)",
        "theme_light": "A\u00e7\u0131k Tema (Light)",
        "ui_language": "Aray\u00fcz Dili",
        "ui_language_desc": "Tercih etti\u011finiz varsay\u0131lan dil",
        "lang_tr": "T\u00fcrk\u00e7e (TR)",
        "lang_en": "English (EN)"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'tr', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
