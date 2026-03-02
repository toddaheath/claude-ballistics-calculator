import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock child components to isolate page logic
vi.mock('../../components/TrajectoryChart', () => ({
  default: () => <div data-testid="trajectory-chart">TrajectoryChart</div>,
}));
vi.mock('../../components/TrajectoryInfo', () => ({
  default: () => <div data-testid="trajectory-info">TrajectoryInfo</div>,
}));
vi.mock('../../components/UnitToggle', () => ({
  default: ({ unitSystem, onChange }: { unitSystem: string; onChange: (u: string) => void }) => (
    <div data-testid="unit-toggle">
      <button onClick={() => onChange('yards')} className={unitSystem === 'yards' ? 'active' : ''}>Yards</button>
      <button onClick={() => onChange('meters')} className={unitSystem === 'meters' ? 'active' : ''}>Meters</button>
    </div>
  ),
}));

const mockTrajectoryResult = {
  points: [
    { range: 0, height: 0, velocity: 2680, energy: 2678, timeOfFlight: 0, mach: 2.38, drop: 0, windDriftInches: 0, dropMoa: 0, dropMils: 0, windDriftMoa: 0, windDriftMils: 0, isTransonic: false },
    { range: 100, height: 0, velocity: 2500, energy: 2329, timeOfFlight: 0.12, mach: 2.22, drop: -1.5, windDriftInches: 0, dropMoa: 0, dropMils: 0, windDriftMoa: 0, windDriftMils: 0, isTransonic: false },
  ],
  zeroRange: 100,
  muzzleVelocity: 2680,
  maxRange: 500,
  cartridgeName: 'Custom Load',
  boreElevationAngleMOA: 1.6,
  heightAt50: 0.8,
  secondCrossingRange: 225,
  shotHeight: 30,
  unitSystem: 'yards' as const,
  transonicRange: 1050,
  dragModel: 'G1',
};

const mockCalculateCustomTrajectory = vi.fn();

vi.mock('../../services/api', () => ({
  calculateCustomTrajectory: (...args: unknown[]) => mockCalculateCustomTrajectory(...args),
}));

describe('CustomCartridgePage', () => {
  let CustomCartridgePage: React.ComponentType;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCalculateCustomTrajectory.mockResolvedValue(mockTrajectoryResult);
    const mod = await import('../CustomCartridgePage');
    CustomCartridgePage = mod.default;
  });

  it('renders the page heading', () => {
    render(<CustomCartridgePage />);
    expect(screen.getByText('Custom Cartridge')).toBeInTheDocument();
    expect(screen.getByText(/Enter your load data/)).toBeInTheDocument();
  });

  it('renders all form fields with default values', () => {
    render(<CustomCartridgePage />);
    expect(screen.getByLabelText('Load Name')).toHaveValue('Custom Load');
    expect(screen.getByLabelText('Bullet Weight (gr)')).toHaveValue(168);
    expect(screen.getByLabelText('Muzzle Velocity (fps)')).toHaveValue(2680);
    expect(screen.getByLabelText('Ballistic Coefficient')).toHaveValue(0.462);
    expect(screen.getByLabelText('Bullet Diameter (in)')).toHaveValue(0.308);
    expect(screen.getByLabelText('Bullet Type')).toHaveValue('BTHP');
    expect(screen.getByLabelText('Drag Model')).toHaveValue('G1');
    expect(screen.getByLabelText('Max Range (yd)')).toHaveValue(500);
  });

  it('renders the Calculate Trajectory button', () => {
    render(<CustomCartridgePage />);
    expect(screen.getByText('Calculate Trajectory')).toBeInTheDocument();
  });

  it('renders the unit toggle', () => {
    render(<CustomCartridgePage />);
    expect(screen.getByTestId('unit-toggle')).toBeInTheDocument();
  });

  it('updates load name', async () => {
    const user = userEvent.setup();
    render(<CustomCartridgePage />);

    const nameInput = screen.getByLabelText('Load Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'My 6.5 Creedmoor');
    expect(nameInput).toHaveValue('My 6.5 Creedmoor');
  });

  it('updates bullet weight', async () => {
    const user = userEvent.setup();
    render(<CustomCartridgePage />);

    const weightInput = screen.getByLabelText('Bullet Weight (gr)');
    await user.clear(weightInput);
    await user.type(weightInput, '140');
    expect(weightInput).toHaveValue(140);
  });

  it('updates drag model selection', async () => {
    const user = userEvent.setup();
    render(<CustomCartridgePage />);

    const dragSelect = screen.getByLabelText('Drag Model');
    await user.selectOptions(dragSelect, 'G7');
    expect(dragSelect).toHaveValue('G7');
  });

  it('renders drag model options', () => {
    render(<CustomCartridgePage />);
    expect(screen.getByText('G1 (flat base)')).toBeInTheDocument();
    expect(screen.getByText('G7 (boat tail)')).toBeInTheDocument();
  });

  it('calls calculateCustomTrajectory on Calculate click', async () => {
    const user = userEvent.setup();
    render(<CustomCartridgePage />);

    await user.click(screen.getByText('Calculate Trajectory'));

    await waitFor(() => {
      expect(mockCalculateCustomTrajectory).toHaveBeenCalledWith({
        name: 'Custom Load',
        bulletWeightGrains: 168,
        muzzleVelocityFps: 2680,
        ballisticCoefficient: 0.462,
        bulletDiameterInches: 0.308,
        bulletType: 'BTHP',
        unitSystem: 'yards',
        maxRange: 500,
        dragModel: 'G1',
        zeroRange: 100,
        shotHeightInches: 30,
        sightHeightInches: 1.5,
      });
    });
  });

  it('shows trajectory chart and info after successful calculation', async () => {
    const user = userEvent.setup();
    render(<CustomCartridgePage />);

    await user.click(screen.getByText('Calculate Trajectory'));

    await waitFor(() => {
      expect(screen.getByTestId('trajectory-chart')).toBeInTheDocument();
      expect(screen.getByTestId('trajectory-info')).toBeInTheDocument();
    });
  });

  it('shows loading state during calculation', async () => {
    const user = userEvent.setup();
    let resolveCalc: (value: unknown) => void;
    mockCalculateCustomTrajectory.mockReturnValue(new Promise((resolve) => { resolveCalc = resolve; }));

    render(<CustomCartridgePage />);

    await user.click(screen.getByText('Calculate Trajectory'));

    expect(screen.getByText('Calculating...')).toBeInTheDocument();

    resolveCalc!(mockTrajectoryResult);

    await waitFor(() => {
      expect(screen.queryByText('Calculating...')).not.toBeInTheDocument();
    });
  });

  it('disables button during loading', async () => {
    const user = userEvent.setup();
    let resolveCalc: (value: unknown) => void;
    mockCalculateCustomTrajectory.mockReturnValue(new Promise((resolve) => { resolveCalc = resolve; }));

    render(<CustomCartridgePage />);

    const btn = screen.getByText('Calculate Trajectory');
    await user.click(btn);

    expect(screen.getByText('Calculating...')).toBeDisabled();

    resolveCalc!(mockTrajectoryResult);
    await waitFor(() => {
      expect(screen.getByText('Calculate Trajectory')).not.toBeDisabled();
    });
  });

  it('shows error on calculation failure', async () => {
    const user = userEvent.setup();
    mockCalculateCustomTrajectory.mockRejectedValue(new Error('Server error'));

    render(<CustomCartridgePage />);

    await user.click(screen.getByText('Calculate Trajectory'));

    await waitFor(() => {
      expect(screen.getByText('Failed to calculate trajectory')).toBeInTheDocument();
    });
  });

  it('does not show chart or info before calculation', () => {
    render(<CustomCartridgePage />);
    expect(screen.queryByTestId('trajectory-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('trajectory-info')).not.toBeInTheDocument();
  });

  it('passes G7 drag model to API when selected', async () => {
    const user = userEvent.setup();
    render(<CustomCartridgePage />);

    await user.selectOptions(screen.getByLabelText('Drag Model'), 'G7');
    await user.click(screen.getByText('Calculate Trajectory'));

    await waitFor(() => {
      expect(mockCalculateCustomTrajectory).toHaveBeenCalledWith(
        expect.objectContaining({ dragModel: 'G7' })
      );
    });
  });
});
