import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { LiveChatWidget } from '../LiveChatWidget';

const queryClient = new QueryClient();

// Mock dependencies
vi.mock('../../api/auth-service', () => ({
  getMe: vi.fn().mockResolvedValue({ id: 1, full_name: 'Test User', role: 'employee' }),
}));

describe('LiveChatWidget Component', () => {
  it('renders chat toggle button initially', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LiveChatWidget />
        </BrowserRouter>
      </QueryClientProvider>
    );
    
    // The widget button should be rendered after query loads
    const button = await screen.findByRole('button');
    expect(button).toBeInTheDocument();
  });
});
