/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from '../../components/Sidebar';

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, toggleTheme: vi.fn() })
}));

vi.mock('../../context/AdminModeContext', () => ({
  useAdminMode: vi.fn().mockReturnValue({ isAdminMode: false, toggleAdminMode: vi.fn() })
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({ data: undefined }),
  useMutation: vi.fn().mockReturnValue({ mutate: vi.fn() }),
  useQueryClient: vi.fn().mockReturnValue({ invalidateQueries: vi.fn() })
}));

import { useQuery } from '@tanstack/react-query';
import { useAdminMode } from '../../context/AdminModeContext';

describe('Sidebar', () => {
  it('renders standard menu items', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Yeni Talep')).toBeInTheDocument();
    expect(screen.getByText('Bilgi Bankası')).toBeInTheDocument();
  });

  it('renders admin menu items for ADMIN role', () => {
    (useQuery as any).mockImplementation((args: any) => {
      if (args.queryKey?.[0] === 'me') {
        return { data: { role: 'ADMIN' } };
      }
      return { data: undefined };
    });
    
    (useAdminMode as any).mockReturnValue({
      isAdminMode: true,
      toggleAdminMode: vi.fn()
    });

    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Sistem Logları')).toBeInTheDocument();
  });
});
