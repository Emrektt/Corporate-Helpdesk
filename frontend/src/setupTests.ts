import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock @azure/msal-browser globally to prevent crypto errors in jsdom
vi.mock('@azure/msal-browser', () => {
  const mockInstance = {
    initialize: vi.fn().mockResolvedValue(undefined),
    loginPopup: vi.fn().mockResolvedValue({ account: { name: 'Test User' } }),
    logoutRedirect: vi.fn().mockResolvedValue(undefined),
    getActiveAccount: vi.fn().mockReturnValue(null),
    getAllAccounts: vi.fn().mockReturnValue([]),
    acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'mock-token' }),
    setActiveAccount: vi.fn(),
    addEventCallback: vi.fn().mockReturnValue('callbackId'),
    removeEventCallback: vi.fn(),
    handleRedirectPromise: vi.fn().mockResolvedValue(null),
  };
  return {
    PublicClientApplication: vi.fn().mockImplementation(() => mockInstance),
    EventType: { LOGIN_SUCCESS: 'msal:loginSuccess', LOGOUT_SUCCESS: 'msal:logoutSuccess' },
    InteractionStatus: { None: 'none', Login: 'login', Logout: 'logout' },
    BrowserAuthError: class BrowserAuthError extends Error { errorCode = ''; subError = ''; correlationId = ''; },
  };
});

// Mock the msal-config module so msalInstance doesn't instantiate PublicClientApplication
vi.mock('./auth/msal-config', () => ({
  msalConfig: {},
  loginRequest: { scopes: [] },
  msalInstance: {
    initialize: vi.fn().mockResolvedValue(undefined),
    loginPopup: vi.fn().mockResolvedValue({ account: { name: 'Test User' } }),
    logoutRedirect: vi.fn().mockResolvedValue(undefined),
    getActiveAccount: vi.fn().mockReturnValue(null),
    getAllAccounts: vi.fn().mockReturnValue([]),
    acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'mock-token' }),
    setActiveAccount: vi.fn(),
    addEventCallback: vi.fn().mockReturnValue('callbackId'),
    removeEventCallback: vi.fn(),
    handleRedirectPromise: vi.fn().mockResolvedValue(null),
  },
}));

// Mock @azure/msal-react globally
vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    instance: {
      loginPopup: vi.fn(),
      logoutRedirect: vi.fn(),
      getActiveAccount: vi.fn().mockReturnValue(null),
      getAllAccounts: vi.fn().mockReturnValue([]),
    },
    accounts: [{ name: 'Test User' }],
    inProgress: 'none',
  }),
  useIsAuthenticated: () => false,
  MsalProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-i18next globally
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'sidebar.menu': 'Menu',
        'sidebar.dashboard': 'Dashboard',
        'sidebar.new_ticket': 'Yeni Talep',
        'sidebar.knowledge_base': 'Bilgi Bankası',
        'sidebar.reports': 'Raporlar',
        'sidebar.system_logs': 'Sistem Logları',
        'sidebar.users': 'Kullanıcılar',
        'sidebar.settings': 'Ayarlar',
        'sidebar.light_theme': 'Aydınlık Tema',
        'sidebar.dark_theme': 'Karanlık Tema',
        'sidebar.notifications': 'Bildirimler',
        'sidebar.mark_all_read': 'Tümünü Oku',
        'sidebar.no_notifications': 'Bildirim yok',
        'sidebar.admin_mode': 'Admin Modu',
        'sidebar.user_mode': 'Kullanıcı Modu',
        'sidebar.switch_to_user': 'Kullanıcı moduna geç →',
        'sidebar.switch_to_admin': '← Admin moduna dön',
        'sidebar.logout': 'Çıkış Yap',
      };
      return map[key] ?? key;
    },
    i18n: { changeLanguage: vi.fn(), language: 'tr' },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));
