import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all lazy-loaded pages
vi.mock('../pages/CartridgeReference', () => ({
  default: () => <div>CartridgeReference Page</div>,
}));
vi.mock('../pages/HowItWorks', () => ({
  default: () => <div>HowItWorks Page</div>,
}));
vi.mock('../pages/ComparePage', () => ({
  default: () => <div>Compare Page</div>,
}));
vi.mock('../pages/CustomCartridgePage', () => ({
  default: () => <div>Custom Load Page</div>,
}));

// Mock API service
vi.mock('../services/api', () => ({
  getCartridges: vi.fn().mockResolvedValue([]),
  calculateTrajectory: vi.fn(),
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}));

// localStorage mock for AuthContext
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

import App from '../App';

describe('App', () => {
  beforeEach(() => {
    storageMock.clear();
    vi.clearAllMocks();
    // Reset hash location
    window.location.hash = '';
  });

  it('renders the site title', async () => {
    render(<App />);
    expect(screen.getByText('Ballistics Calculator')).toBeInTheDocument();
  });

  it('renders navigation links', async () => {
    render(<App />);
    expect(screen.getByText('Calculator')).toBeInTheDocument();
    expect(screen.getByText('Cartridge Reference')).toBeInTheDocument();
    expect(screen.getByText('Compare')).toBeInTheDocument();
    expect(screen.getByText('Custom Load')).toBeInTheDocument();
    expect(screen.getByText('How It Works')).toBeInTheDocument();
  });

  it('shows Sign In and Register nav links when not authenticated', () => {
    render(<App />);
    // Nav has Sign In and Register links; the login page also renders
    // so check specifically within the nav
    const nav = document.querySelector('.site-nav')!;
    expect(nav.textContent).toContain('Sign In');
    expect(nav.textContent).toContain('Register');
  });

  it('redirects to login page when accessing protected route unauthenticated', async () => {
    render(<App />);

    // The main calculator page is protected, so when unauthenticated
    // it should show the login form
    await waitFor(() => {
      expect(document.querySelector('.auth-card')).not.toBeNull();
    });
  });

  it('navigates to Cartridge Reference (public route)', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('Cartridge Reference'));

    await waitFor(() => {
      expect(screen.getByText('CartridgeReference Page')).toBeInTheDocument();
    });
  });

  it('navigates to How It Works (public route)', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('How It Works'));

    await waitFor(() => {
      expect(screen.getByText('HowItWorks Page')).toBeInTheDocument();
    });
  });

  it('shows user email and logout when authenticated', async () => {
    storageMock.setItem('auth_user', JSON.stringify({
      userId: 1, email: 'user@test.com', token: 'test-token',
    }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('user@test.com')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  it('shows calculator when authenticated', async () => {
    storageMock.setItem('auth_user', JSON.stringify({
      userId: 1, email: 'user@test.com', token: 'test-token',
    }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Trajectory Calculator')).toBeInTheDocument();
    });
  });
});
