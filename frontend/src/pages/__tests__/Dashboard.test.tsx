import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Dashboard } from '../../pages/Dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../context/AdminModeContext', () => ({
  useAdminMode: () => ({ isAdminMode: false, toggleAdminMode: vi.fn() })
}));

// Mock the services
vi.mock('../../api/analytics-service', () => ({
  getAnalyticsSummary: vi.fn().mockResolvedValue({
    total_tickets: 15,
    open_tickets: 5,
    resolved_tickets: 10,
    active_departments: 3,
    active_users: 2,
  })
}));

vi.mock('../../api/ticket-service', () => ({
  getTickets: vi.fn().mockResolvedValue({
    total: 1,
    page: 1,
    limit: 10,
    items: [
      {
        id: 1,
        ticket_number: 'TK-123',
        title: 'Login Issue',
        status: 'Açık',
        priority: 'HIGH',
        created_at: new Date().toISOString(),
        department: { name: 'IT' },
        category: { name: 'Access' }
      }
    ]
  })
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

describe('Dashboard', () => {
  it('renders analytics cards correctly', async () => {

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Wait for mock data to be loaded and animations to finish
    expect(await screen.findByText('15', {}, { timeout: 4000 })).toBeInTheDocument(); // total tickets
    expect(screen.getByText('5')).toBeInTheDocument(); // open tickets
    expect(screen.getByText('10')).toBeInTheDocument(); // resolved tickets
    expect(screen.getByText('TK-123')).toBeInTheDocument(); // ticket row
  });
});
