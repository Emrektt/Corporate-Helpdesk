import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMe, testLogin } from '../auth-service';
import { axiosClient } from '../axios-client';

// Mock axios client
vi.mock('../axios-client', () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMe should fetch user profile correctly', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'ADMIN',
      department_id: 1,
      is_active: true
    };
    
    vi.mocked(axiosClient.get).mockResolvedValueOnce({ data: mockUser });
    
    const result = await getMe();
    
    expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/auth/me');
    expect(result).toEqual(mockUser);
  });

  it('testLogin should return access token', async () => {
    const mockToken = { access_token: 'fake-jwt-token' };
    
    vi.mocked(axiosClient.post).mockResolvedValueOnce({ data: mockToken });
    
    const result = await testLogin('test@example.com');
    
    expect(axiosClient.post).toHaveBeenCalledWith('/api/v1/auth/login', { email: 'test@example.com' });
    expect(result).toEqual(mockToken);
  });
});
