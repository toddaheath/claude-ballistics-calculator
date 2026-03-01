import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock the API module
vi.mock('../../services/api', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}));

import { loginUser, registerUser } from '../../services/api';

const mockedLogin = vi.mocked(loginUser);
const mockedRegister = vi.mocked(registerUser);

// Create a proper localStorage mock (Node 22+ built-in localStorage conflicts with jsdom)
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  };
})();

Object.defineProperty(window, 'localStorage', { value: storageMock, writable: true });

// Test component that exposes auth context
function AuthConsumer() {
  const { user, isAuthenticated, login, register, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'anonymous'}</span>
      <span data-testid="user-email">{user?.email ?? 'none'}</span>
      <button onClick={() => login({ email: 'test@test.com', password: 'pass123' })}>Login</button>
      <button onClick={() => register({ email: 'new@test.com', password: 'pass123' })}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    storageMock.clear();
    vi.clearAllMocks();
  });

  it('starts as anonymous when no stored user', () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('anonymous');
    expect(screen.getByTestId('user-email')).toHaveTextContent('none');
  });

  it('restores user from localStorage', () => {
    storageMock.setItem('auth_user', JSON.stringify({
      userId: 1, email: 'stored@test.com', token: 'stored-token',
    }));
    // Reset the mock call count so we only track calls from the component
    storageMock.getItem.mockClear();

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user-email')).toHaveTextContent('stored@test.com');
  });

  it('handles corrupt localStorage gracefully', () => {
    storageMock.setItem('auth_user', 'not-json');

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('anonymous');
  });

  it('login sets user and stores token', async () => {
    const user = userEvent.setup();
    mockedLogin.mockResolvedValue({
      token: 'jwt-token',
      refreshToken: 'refresh-token',
      email: 'test@test.com',
      userId: 42,
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText('Login'));

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@test.com');
    // refresh_token is set synchronously in login(); auth_token is set by useEffect
    expect(storageMock.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token');
    await waitFor(() => {
      expect(storageMock.setItem).toHaveBeenCalledWith('auth_token', 'jwt-token');
    });
  });

  it('register sets user and stores token', async () => {
    const user = userEvent.setup();
    mockedRegister.mockResolvedValue({
      token: 'reg-token',
      refreshToken: 'reg-refresh',
      email: 'new@test.com',
      userId: 99,
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText('Register'));

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user-email')).toHaveTextContent('new@test.com');
    expect(storageMock.setItem).toHaveBeenCalledWith('refresh_token', 'reg-refresh');
    await waitFor(() => {
      expect(storageMock.setItem).toHaveBeenCalledWith('auth_token', 'reg-token');
    });
  });

  it('logout clears user and removes tokens', async () => {
    const user = userEvent.setup();
    storageMock.setItem('auth_token', 'old-token');
    storageMock.setItem('auth_user', JSON.stringify({
      userId: 1, email: 'user@test.com', token: 'old-token',
    }));
    storageMock.setItem('refresh_token', 'old-refresh');

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');

    await user.click(screen.getByText('Logout'));

    expect(screen.getByTestId('auth-status')).toHaveTextContent('anonymous');
    expect(storageMock.removeItem).toHaveBeenCalledWith('auth_token');
    expect(storageMock.removeItem).toHaveBeenCalledWith('auth_user');
    expect(storageMock.removeItem).toHaveBeenCalledWith('refresh_token');
  });

  it('useAuth throws when used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<AuthConsumer />)).toThrow(
      'useAuth must be used inside AuthProvider'
    );

    spy.mockRestore();
  });
});
