import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Label: () => null,
}));

const mockCartridges = [
  { id: 1, name: '9mm Luger 115gr FMJ', category: 'Handgun', bulletType: 'FMJ', bulletWeightGrains: 115, muzzleVelocityFps: 1180, ballisticCoefficientG1: 0.125 },
  { id: 2, name: '.45 ACP 230gr FMJ', category: 'Handgun', bulletType: 'FMJ', bulletWeightGrains: 230, muzzleVelocityFps: 830, ballisticCoefficientG1: 0.195 },
  { id: 29, name: '.308 Win 168gr BTHP Match', category: 'Standard Rifle', bulletType: 'BTHP', bulletWeightGrains: 168, muzzleVelocityFps: 2680, ballisticCoefficientG1: 0.462 },
  { id: 30, name: '.308 Win 175gr SMK', category: 'Standard Rifle', bulletType: 'SMK', bulletWeightGrains: 175, muzzleVelocityFps: 2600, ballisticCoefficientG1: 0.505 },
  { id: 40, name: '.300 Win Mag 190gr BTHP Match', category: 'Magnum', bulletType: 'BTHP', bulletWeightGrains: 190, muzzleVelocityFps: 2900, ballisticCoefficientG1: 0.533 },
];

const mockCompareResult = {
  trajectories: [
    {
      points: [
        { range: 0, height: 0, velocity: 2680, energy: 2678, timeOfFlight: 0, mach: 2.38, drop: 0, windDriftInches: 0, dropMoa: 0, dropMils: 0, windDriftMoa: 0, windDriftMils: 0, isTransonic: false },
        { range: 100, height: 0, velocity: 2500, energy: 2329, timeOfFlight: 0.12, mach: 2.22, drop: -1.5, windDriftInches: 0.5, dropMoa: 0, dropMils: 0, windDriftMoa: 0.48, windDriftMils: 0.14, isTransonic: false },
      ],
      zeroRange: 100, muzzleVelocity: 2680, maxRange: 500,
      cartridgeName: '.308 Win 168gr BTHP Match',
      boreElevationAngleMOA: 1.6, heightAt50: 0.8, secondCrossingRange: 225,
      shotHeight: 30, unitSystem: 'yards' as const, transonicRange: 1050, dragModel: 'G1',
    },
    {
      points: [
        { range: 0, height: 0, velocity: 2600, energy: 2627, timeOfFlight: 0, mach: 2.31, drop: 0, windDriftInches: 0, dropMoa: 0, dropMils: 0, windDriftMoa: 0, windDriftMils: 0, isTransonic: false },
        { range: 100, height: 0, velocity: 2430, energy: 2296, timeOfFlight: 0.12, mach: 2.16, drop: -1.6, windDriftInches: 0.4, dropMoa: 0, dropMils: 0, windDriftMoa: 0.38, windDriftMils: 0.11, isTransonic: false },
      ],
      zeroRange: 100, muzzleVelocity: 2600, maxRange: 500,
      cartridgeName: '.308 Win 175gr SMK',
      boreElevationAngleMOA: 1.7, heightAt50: 0.85, secondCrossingRange: 230,
      shotHeight: 30, unitSystem: 'yards' as const, transonicRange: 1100, dragModel: 'G1',
    },
  ],
  unitSystem: 'yards' as const,
};

const mockGetCartridges = vi.fn();
const mockCompareTrajectories = vi.fn();

vi.mock('../../services/api', () => ({
  getCartridges: (...args: unknown[]) => mockGetCartridges(...args),
  compareTrajectories: (...args: unknown[]) => mockCompareTrajectories(...args),
}));

describe('ComparePage', () => {
  let ComparePage: React.ComponentType;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetCartridges.mockResolvedValue(mockCartridges);
    mockCompareTrajectories.mockResolvedValue(mockCompareResult);
    const mod = await import('../ComparePage');
    ComparePage = mod.default;
  });

  it('renders the page heading', async () => {
    render(<ComparePage />);
    expect(screen.getByText('Compare Trajectories')).toBeInTheDocument();
    expect(screen.getByText(/Select 2-5 cartridges/)).toBeInTheDocument();
  });

  it('renders two selector dropdowns by default', async () => {
    render(<ComparePage />);
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBe(2);
    });
  });

  it('loads cartridges on mount', async () => {
    render(<ComparePage />);
    await waitFor(() => {
      expect(mockGetCartridges).toHaveBeenCalledOnce();
    });
  });

  it('populates dropdowns with cartridges grouped by category', async () => {
    render(<ComparePage />);
    await waitFor(() => {
      expect(screen.getAllByText('9mm Luger 115gr FMJ').length).toBeGreaterThanOrEqual(1);
    });
    // Check optgroup labels exist
    const optgroups = document.querySelectorAll('optgroup');
    const labels = Array.from(optgroups).map(g => g.getAttribute('label'));
    expect(labels).toContain('Handgun');
    expect(labels).toContain('Standard Rifle');
  });

  it('shows error when cartridge loading fails', async () => {
    mockGetCartridges.mockRejectedValue(new Error('Network error'));
    render(<ComparePage />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load cartridges')).toBeInTheDocument();
    });
  });

  it('adds a third selector when clicking Add Cartridge', async () => {
    const user = userEvent.setup();
    render(<ComparePage />);
    await waitFor(() => expect(mockGetCartridges).toHaveBeenCalled());

    await user.click(screen.getByText('+ Add Cartridge'));

    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBe(3);
  });

  it('hides Add Cartridge button at 5 selectors', async () => {
    const user = userEvent.setup();
    render(<ComparePage />);
    await waitFor(() => expect(mockGetCartridges).toHaveBeenCalled());

    // Add 3 more (2 default + 3 = 5)
    await user.click(screen.getByText('+ Add Cartridge'));
    await user.click(screen.getByText('+ Add Cartridge'));
    await user.click(screen.getByText('+ Add Cartridge'));

    expect(screen.queryByText('+ Add Cartridge')).not.toBeInTheDocument();
    expect(screen.getAllByRole('combobox').length).toBe(5);
  });

  it('shows remove buttons when more than 2 selectors', async () => {
    const user = userEvent.setup();
    render(<ComparePage />);
    await waitFor(() => expect(mockGetCartridges).toHaveBeenCalled());

    // Initially 2 selectors — no remove buttons
    expect(document.querySelectorAll('.remove-cartridge-btn').length).toBe(0);

    // Add a third
    await user.click(screen.getByText('+ Add Cartridge'));

    // Now should have remove buttons
    expect(document.querySelectorAll('.remove-cartridge-btn').length).toBe(3);
  });

  it('removes a selector when clicking remove', async () => {
    const user = userEvent.setup();
    render(<ComparePage />);
    await waitFor(() => expect(mockGetCartridges).toHaveBeenCalled());

    await user.click(screen.getByText('+ Add Cartridge'));
    expect(screen.getAllByRole('combobox').length).toBe(3);

    const removeBtns = document.querySelectorAll('.remove-cartridge-btn');
    await user.click(removeBtns[0]);
    expect(screen.getAllByRole('combobox').length).toBe(2);
  });

  it('disables Compare button when fewer than 2 cartridges selected', async () => {
    render(<ComparePage />);
    await waitFor(() => expect(mockGetCartridges).toHaveBeenCalled());

    const compareBtn = screen.getByText('Compare');
    expect(compareBtn).toBeDisabled();
  });

  it('enables Compare button when 2 cartridges are selected', async () => {
    const user = userEvent.setup();
    render(<ComparePage />);
    await waitFor(() => expect(mockGetCartridges).toHaveBeenCalled());

    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], '29');
    await user.selectOptions(selects[1], '30');

    const compareBtn = screen.getByText('Compare');
    expect(compareBtn).not.toBeDisabled();
  });

  it('calls compareTrajectories and shows chart on Compare click', async () => {
    const user = userEvent.setup();
    render(<ComparePage />);
    await waitFor(() => expect(mockGetCartridges).toHaveBeenCalled());

    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], '29');
    await user.selectOptions(selects[1], '30');
    await user.click(screen.getByText('Compare'));

    await waitFor(() => {
      expect(mockCompareTrajectories).toHaveBeenCalledWith({
        cartridgeIds: [29, 30],
        unitSystem: 'yards',
        zeroRange: 100,
        maxRange: 500,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Trajectory Comparison')).toBeInTheDocument();
    });
  });

  it('shows loading state while comparing', async () => {
    const user = userEvent.setup();
    let resolveCompare: (value: unknown) => void;
    mockCompareTrajectories.mockReturnValue(new Promise((resolve) => { resolveCompare = resolve; }));

    render(<ComparePage />);
    await waitFor(() => expect(mockGetCartridges).toHaveBeenCalled());

    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], '29');
    await user.selectOptions(selects[1], '30');
    await user.click(screen.getByText('Compare'));

    expect(screen.getByText('Comparing...')).toBeInTheDocument();
    expect(screen.getByText('Comparing trajectories...')).toBeInTheDocument();

    resolveCompare!(mockCompareResult);

    await waitFor(() => {
      expect(screen.queryByText('Comparing...')).not.toBeInTheDocument();
    });
  });

  it('shows error on comparison failure', async () => {
    const user = userEvent.setup();
    mockCompareTrajectories.mockRejectedValue(new Error('API error'));

    render(<ComparePage />);
    await waitFor(() => expect(mockGetCartridges).toHaveBeenCalled());

    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], '29');
    await user.selectOptions(selects[1], '30');
    await user.click(screen.getByText('Compare'));

    await waitFor(() => {
      expect(screen.getByText('Failed to compare trajectories')).toBeInTheDocument();
    });
  });

  it('renders unit toggle with Yards and Meters', async () => {
    render(<ComparePage />);
    expect(screen.getByText('Yards')).toBeInTheDocument();
    expect(screen.getByText('Meters')).toBeInTheDocument();
  });

  it('toggles unit system to meters', async () => {
    const user = userEvent.setup();
    render(<ComparePage />);
    await waitFor(() => expect(mockGetCartridges).toHaveBeenCalled());

    await user.click(screen.getByText('Meters'));

    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], '29');
    await user.selectOptions(selects[1], '30');
    await user.click(screen.getByText('Compare'));

    await waitFor(() => {
      expect(mockCompareTrajectories).toHaveBeenCalledWith(
        expect.objectContaining({ unitSystem: 'meters' })
      );
    });
  });

  it('does not call compare when only 1 cartridge selected', async () => {
    const user = userEvent.setup();
    render(<ComparePage />);
    await waitFor(() => expect(mockGetCartridges).toHaveBeenCalled());

    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], '29');

    // Button is still disabled since only 1 is selected
    const compareBtn = screen.getByText('Compare');
    expect(compareBtn).toBeDisabled();
  });
});
