import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthProvider';
import { AuthenticatedTemplate } from '@azure/msal-react';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { CreateTicket } from './pages/CreateTicket';
import { TicketDetail } from './pages/TicketDetail';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { LiveChatWidget } from './components/LiveChatWidget';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Authenticated layout wrapper: shows Sidebar + main content
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
        <Sidebar />
        <main style={{
          flex: 1,
          minWidth: 0,
          padding: '32px 28px',
          transition: 'all 0.25s ease',
          background: 'var(--bg-app)',
          color: 'var(--text-primary)',
        }}>
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

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
            </Routes>

            <AuthenticatedTemplate>
              <LiveChatWidget />
            </AuthenticatedTemplate>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
