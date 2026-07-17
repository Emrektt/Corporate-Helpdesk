import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthProvider';
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
import { Login } from './pages/Login';
import { Register } from './pages/Register';

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
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

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

            {/* LiveChat: hem MSAL hem yerel girişte göster */}
            <LiveChatWidget />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
