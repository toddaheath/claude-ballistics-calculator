import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Cartridge, TrajectoryResponse, TrajectoryPoint } from '../types';

// Mock recharts (used by TrajectoryChart)
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  Label: () => <div />,
  ReferenceLine: () => <div />,
  ReferenceDot: () => <div />,
  ReferenceArea: () => <div />,
}));

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
const mockGetCartridges = vi.fn().mockResolvedValue([]);
const mockCalculateTrajectory = vi.fn();
vi.mock('../services/api', () => ({
  getCartridges: (...args: unknown[]) => mockGetCartridges(...args),
  calculateTrajectory: (...args: unknown[]) => mockCalculateTrajectory(...args),
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}));

const sampleCartridges: Cartridge[] = [
  { id: 29, name: '.308 Win 168gr BTHP', category: 'Standard Rifle', bulletType: 'BTHP', bulletWeightGrains: 168, muzzleVelocityFps: 2680, ballisticCoefficientG1: 0.462 },
  { id: 30, name: '.308 Win 175gr SMK', category: 'Standard Rifle', bulletType: 'SMK', bulletWeightGrains: 175, muzzleVelocityFps: 2610, ballisticCoefficientG1: 0.505 },
];

function makePoint(range: number): TrajectoryPoint {
  return { range, height: -range * 0.01, velocity: 2680 - range * 2, energy: 2500 - range * 3, timeOfFlight: range * 0.001, mach: 2.4 - range * 0.001, drop: -range * 0.02, windDriftInches: range * 0.005, dropMoa: range * 0.01, dropMils: range * 0.003, windDriftMoa: range * 0.005, windDriftMils: range * 0.0015, isTransonic: false };
}

const sampleTrajectory: TrajectoryResponse = {
  points: [makePoint(0), makePoint(50), makePoint(100), makePoint(150)],
  zeroRange: 100, muzzleVelocity: 2680, maxRange: 150, cartridgeName: '.308 Win 168gr BTHP',
  boreElevationAngleMOA: 3.5, heightAt50: 0.8, secondCrossingRange: 100, shotHeight: 30,
  unitSystem: 'yards', transonicRange: 900, dragModel: 'G1',
};

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

  it('shows not found page for unknown routes', async () => {
    window.location.hash = '#/nonexistent-page';
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.getByText('Back to Calculator')).toBeInTheDocument();
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

describe('Calculator', () => {
  function authenticateUser() {
    storageMock.setItem('auth_user', JSON.stringify({
      userId: 1, email: 'calc@test.com', token: 'test-token',
    }));
  }

  beforeEach(() => {
    storageMock.clear();
    vi.clearAllMocks();
    window.location.hash = '';
    mockGetCartridges.mockResolvedValue(sampleCartridges);
  });

  it('loads and displays cartridges in the selector', async () => {
    authenticateUser();
    render(<App />);

    await waitFor(() => {
      expect(mockGetCartridges).toHaveBeenCalled();
    });

    const select = screen.getByLabelText('Select Cartridge:');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('');
    expect(screen.getByText('.308 Win 168gr BTHP (168gr BTHP)')).toBeInTheDocument();
    expect(screen.getByText('.308 Win 175gr SMK (175gr SMK)')).toBeInTheDocument();
  });

  it('fetches trajectory when a cartridge is selected', async () => {
    authenticateUser();
    mockCalculateTrajectory.mockResolvedValue(sampleTrajectory);
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText('Select Cartridge:')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Select Cartridge:'), '29');

    await waitFor(() => {
      expect(mockCalculateTrajectory).toHaveBeenCalledWith(
        expect.objectContaining({ cartridgeId: 29, unitSystem: 'yards' })
      );
    });
  });

  it('displays trajectory data after calculation', async () => {
    authenticateUser();
    mockCalculateTrajectory.mockResolvedValue(sampleTrajectory);
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText('Select Cartridge:')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Select Cartridge:'), '29');

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('shows error when trajectory calculation fails', async () => {
    authenticateUser();
    mockCalculateTrajectory.mockRejectedValue(new Error('API error'));
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText('Select Cartridge:')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Select Cartridge:'), '29');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to calculate trajectory');
    });
  });

  it('shows error when cartridge loading fails', async () => {
    authenticateUser();
    mockGetCartridges.mockRejectedValue(new Error('Network error'));
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load cartridges');
    });
  });

  it('shows loading state during calculation', async () => {
    authenticateUser();
    // Make calculateTrajectory hang until we resolve it
    let resolveCalc!: (v: TrajectoryResponse) => void;
    mockCalculateTrajectory.mockReturnValue(new Promise<TrajectoryResponse>(r => { resolveCalc = r; }));
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText('Select Cartridge:')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Select Cartridge:'), '29');

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Calculating trajectory...');
    });

    // Resolve and verify loading clears
    resolveCalc(sampleTrajectory);
    await waitFor(() => {
      expect(screen.queryByText('Calculating trajectory...')).not.toBeInTheDocument();
    });
  });
});
