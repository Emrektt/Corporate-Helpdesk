import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import { AdminModeProvider } from './context/AdminModeContext';
import { AdminRoute } from './auth/AdminRoute';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { CreateTicket } from './pages/CreateTicket';
import { TicketDetail } from './pages/TicketDetail';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { LiveChatWidget } from './components/LiveChatWidget';
import { Login } from './pages/Login';
import { SystemLogs } from './pages/SystemLogs';
import { Users } from './pages/Users';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      // Veriyi 2 dakika boyunca "taze" say — gereksiz arka plan isteklerini engelle
      staleTime: 2 * 60 * 1000,
    },
  },
});

import { useEffect } from 'react';
import { getMyPreferences } from './api/user-preference-service';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from './context/ThemeContext';
import { useTranslation } from 'react-i18next';

// Authenticated layout wrapper: shows Sidebar + main content
function AppLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  
  const { data: userPref } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: getMyPreferences,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (userPref && userPref.theme && userPref.theme !== 'system') {
      if (userPref.theme !== theme) {
        setTheme(userPref.theme as 'light' | 'dark');
      }
    } else if (userPref && userPref.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      if (systemTheme !== theme) {
        setTheme(systemTheme);
      }
    }

    if (userPref && userPref.language) {
      if (userPref.language !== i18n.language) {
        i18n.changeLanguage(userPref.language);
      }
    }
  }, [userPref, theme, setTheme, i18n]);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-[var(--bg-app)]">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 transition-all duration-250 ease-in-out text-[var(--text-primary)] bg-[var(--bg-app)]">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AdminModeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <GlobalErrorBoundary>
            <Router>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />

              <Route path="/dashboard" element={
                <AppLayout><Dashboard /></AppLayout>
              } />

              <Route path="/create-ticket" element={
                <AppLayout><CreateTicket /></AppLayout>
              } />

              <Route path="/ticket/:id" element={
                <AppLayout><TicketDetail /></AppLayout>
              } />

              <Route path="/settings" element={
                <AppLayout><Settings /></AppLayout>
              } />

              <Route path="/reports" element={
                <AppLayout><Reports /></AppLayout>
              } />

              <Route path="/knowledge-base" element={
                <AppLayout><KnowledgeBase /></AppLayout>
              } />

              <Route path="/admin/logs" element={
                <AppLayout><AdminRoute><SystemLogs /></AdminRoute></AppLayout>
              } />

              <Route path="/admin/users" element={
                <AppLayout><AdminRoute><Users /></AdminRoute></AppLayout>
              } />
            </Routes>

            {/* LiveChat: hem MSAL hem yerel girişte göster */}
            <LiveChatWidget />
          </Router>
          </GlobalErrorBoundary>
        </AuthProvider>
      </QueryClientProvider>
      </AdminModeProvider>
    </ThemeProvider>
  );
}

export default App;
