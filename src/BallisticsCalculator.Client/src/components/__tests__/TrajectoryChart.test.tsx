import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import type { TrajectoryResponse, TrajectoryPoint } from '../../types';
import TrajectoryChart from '../TrajectoryChart';

// Mock recharts — jsdom doesn't support SVG layout
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="line-chart" data-point-count={data.length}>{children}</div>
  ),
  Line: ({ dataKey, name }: { dataKey: string; name: string }) => (
    <div data-testid={`line-${dataKey}`} data-name={name} />
  ),
  XAxis: ({ children }: { children?: React.ReactNode }) => <div data-testid="x-axis">{children}</div>,
  YAxis: ({ children }: { children?: React.ReactNode }) => <div data-testid="y-axis">{children}</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Label: ({ value }: { value: string }) => <span data-testid="label">{value}</span>,
  ReferenceLine: ({ y, label }: { y: number; label?: { value: string } }) => (
    <div data-testid="reference-line" data-y={y}>{label?.value}</div>
  ),
  ReferenceDot: ({ x, y, label }: { x: number; y: number; label?: { value: string } }) => (
    <div data-testid="reference-dot" data-x={x} data-y={y}>{label?.value}</div>
  ),
  ReferenceArea: ({ x1, x2, label }: { x1: number; x2: number; label?: { value: string } }) => (
    <div data-testid="reference-area" data-x1={x1} data-x2={x2}>{label?.value}</div>
  ),
}));

function makePoint(range: number, overrides?: Partial<TrajectoryPoint>): TrajectoryPoint {
  return {
    range,
    height: range < 100 ? 2.0 : -(range - 100) * 0.05,
    velocity: 2800 - range * 2,
    energy: 2400 - range * 1.5,
    timeOfFlight: range / 2800,
    mach: 2.5 - range * 0.002,
    drop: -(range * 0.01),
    windDriftInches: 0,
    dropMoa: 0,
    dropMils: 0,
    windDriftMoa: 0,
    windDriftMils: 0,
    isTransonic: false,
    ...overrides,
  };
}

function makeData(overrides?: Partial<TrajectoryResponse>): TrajectoryResponse {
  // Generate 101 points: 0, 5, 10, ... 500
  const points = Array.from({ length: 101 }, (_, i) => makePoint(i * 5));
  return {
    points,
    zeroRange: 100,
    muzzleVelocity: 2800,
    maxRange: 500,
    cartridgeName: '.308 Winchester 168gr BTHP',
    boreElevationAngleMOA: 2.5,
    heightAt50: 1.2,
    secondCrossingRange: 230,
    shotHeight: 30,
    unitSystem: 'yards',
    transonicRange: 0,
    dragModel: 'G1',
    ...overrides,
  };
}

const defaultProps = () => ({
  data: makeData(),
  maxRange: 500,
  unitSystem: 'yards' as const,
  onMaxRangeChange: vi.fn(),
});

describe('TrajectoryChart', () => {
  it('renders the chart with cartridge name', () => {
    render(<TrajectoryChart {...defaultProps()} />);
    expect(screen.getByText('Trajectory: .308 Winchester 168gr BTHP')).toBeInTheDocument();
  });

  it('has role="figure" with correct aria-label', () => {
    render(<TrajectoryChart {...defaultProps()} />);
    const figure = screen.getByRole('figure');
    expect(figure).toHaveAttribute('aria-label', 'Trajectory chart for .308 Winchester 168gr BTHP');
  });

  it('renders range preset buttons in yards', () => {
    render(<TrajectoryChart {...defaultProps()} />);
    expect(screen.getByText('150yd')).toBeInTheDocument();
    expect(screen.getByText('300yd')).toBeInTheDocument();
    expect(screen.getByText('500yd')).toBeInTheDocument();
    expect(screen.getByText('750yd')).toBeInTheDocument();
    expect(screen.getByText('1000yd')).toBeInTheDocument();
  });

  it('renders range preset buttons in meters', () => {
    const props = defaultProps();
    props.unitSystem = 'meters';
    render(<TrajectoryChart {...props} />);
    expect(screen.getByText('150m')).toBeInTheDocument();
    expect(screen.getByText('500m')).toBeInTheDocument();
    expect(screen.getByText('1000m')).toBeInTheDocument();
  });

  it('marks the active range preset', () => {
    render(<TrajectoryChart {...defaultProps()} />);
    const active = screen.getByText('500yd');
    expect(active).toHaveClass('active');
    expect(active).toHaveAttribute('aria-pressed', 'true');

    const inactive = screen.getByText('300yd');
    expect(inactive).not.toHaveClass('active');
    expect(inactive).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onMaxRangeChange when clicking a preset', async () => {
    const user = userEvent.setup();
    const props = defaultProps();
    render(<TrajectoryChart {...props} />);

    await user.click(screen.getByText('300yd'));
    expect(props.onMaxRangeChange).toHaveBeenCalledWith(300);
  });

  it('has correct aria-label on preset buttons', () => {
    render(<TrajectoryChart {...defaultProps()} />);
    expect(screen.getByText('150yd')).toHaveAttribute('aria-label', 'Set max range to 150 yd');
    expect(screen.getByText('1000yd')).toHaveAttribute('aria-label', 'Set max range to 1000 yd');
  });

  it('renders axis labels for yards', () => {
    render(<TrajectoryChart {...defaultProps()} />);
    expect(screen.getByText('Range (yards)')).toBeInTheDocument();
    expect(screen.getByText('Height (inches)')).toBeInTheDocument();
  });

  it('renders axis labels for meters', () => {
    const props = defaultProps();
    props.unitSystem = 'meters';
    render(<TrajectoryChart {...props} />);
    expect(screen.getByText('Range (m)')).toBeInTheDocument();
    expect(screen.getByText('Height (cm)')).toBeInTheDocument();
  });

  it('renders the height trajectory line', () => {
    render(<TrajectoryChart {...defaultProps()} />);
    const line = screen.getByTestId('line-height');
    expect(line).toHaveAttribute('data-name', 'height');
  });

  it('renders line of sight reference line at y=0', () => {
    render(<TrajectoryChart {...defaultProps()} />);
    const refLines = screen.getAllByTestId('reference-line');
    const losLine = refLines.find(el => el.textContent?.includes('Line of sight'));
    expect(losLine).toBeTruthy();
    expect(losLine).toHaveAttribute('data-y', '0');
  });

  it('renders height-at-50 reference line when non-zero', () => {
    render(<TrajectoryChart {...defaultProps()} />);
    const refLines = screen.getAllByTestId('reference-line');
    const h50Line = refLines.find(el => el.textContent?.includes('@ 50'));
    expect(h50Line).toBeTruthy();
  });

  it('does not render height-at-50 line when heightAt50 is 0', () => {
    const props = defaultProps();
    props.data = makeData({ heightAt50: 0 });
    render(<TrajectoryChart {...props} />);
    const refLines = screen.getAllByTestId('reference-line');
    const h50Line = refLines.find(el => el.textContent?.includes('@ 50'));
    expect(h50Line).toBeUndefined();
  });

  it('renders zero crossing dot', () => {
    render(<TrajectoryChart {...defaultProps()} />);
    const dots = screen.getAllByTestId('reference-dot');
    const zeroDot = dots.find(el => el.textContent?.includes('Zero 100yd'));
    expect(zeroDot).toBeTruthy();
    expect(zeroDot).toHaveAttribute('data-x', '100');
    expect(zeroDot).toHaveAttribute('data-y', '0');
  });

  it('renders second crossing dot when range > 0', () => {
    render(<TrajectoryChart {...defaultProps()} />);
    const dots = screen.getAllByTestId('reference-dot');
    const crossDot = dots.find(el => el.textContent?.includes('230yd'));
    expect(crossDot).toBeTruthy();
  });

  it('does not render second crossing dot when range is 0', () => {
    const props = defaultProps();
    props.data = makeData({ secondCrossingRange: 0 });
    render(<TrajectoryChart {...props} />);
    const dots = screen.getAllByTestId('reference-dot');
    const crossDot = dots.find(el => el.textContent?.includes('yd') && !el.textContent?.includes('Zero'));
    expect(crossDot).toBeUndefined();
  });

  it('renders transonic zone when transonicRange > 0', () => {
    const props = defaultProps();
    props.data = makeData({ transonicRange: 400 });
    render(<TrajectoryChart {...props} />);
    const area = screen.getByTestId('reference-area');
    expect(area).toHaveAttribute('data-x1', '400');
    expect(area.textContent).toContain('Transonic Zone');
  });

  it('does not render transonic zone when transonicRange is 0', () => {
    render(<TrajectoryChart {...defaultProps()} />);
    expect(screen.queryByTestId('reference-area')).not.toBeInTheDocument();
  });

  it('renders wind drift line when wind data exists', () => {
    const points = Array.from({ length: 101 }, (_, i) =>
      makePoint(i * 5, { windDriftInches: i * 0.1 })
    );
    const props = defaultProps();
    props.data = makeData({ points });
    render(<TrajectoryChart {...props} />);
    const windLine = screen.getByTestId('line-windDriftInches');
    expect(windLine).toHaveAttribute('data-name', 'wind drift');
  });

  it('does not render wind drift line when no wind', () => {
    render(<TrajectoryChart {...defaultProps()} />);
    expect(screen.queryByTestId('line-windDriftInches')).not.toBeInTheDocument();
  });

  it('downsamples chart data to every 5th point', () => {
    const props = defaultProps();
    // 101 points (0..500 step 5). Every 5th = indices 0,5,10,...100 = 21 pts + last (100) already included = 21
    render(<TrajectoryChart {...props} />);
    const chart = screen.getByTestId('line-chart');
    const count = Number(chart.getAttribute('data-point-count'));
    expect(count).toBeLessThan(101);
    expect(count).toBeGreaterThan(0);
  });

  it('renders first crossing dot at 50yd when heightAt50 non-zero', () => {
    render(<TrajectoryChart {...defaultProps()} />);
    const dots = screen.getAllByTestId('reference-dot');
    const firstCross = dots.find(el => el.getAttribute('data-x') === '50');
    expect(firstCross).toBeTruthy();
  });

  it('renders first crossing dot at 45.7m in metric mode', () => {
    const props = defaultProps();
    props.unitSystem = 'meters';
    render(<TrajectoryChart {...props} />);
    const dots = screen.getAllByTestId('reference-dot');
    const metricCross = dots.find(el => el.getAttribute('data-x') === '45.7');
    expect(metricCross).toBeTruthy();
  });

  it('does not render first crossing dot when heightAt50 is 0', () => {
    const props = defaultProps();
    props.data = makeData({ heightAt50: 0 });
    render(<TrajectoryChart {...props} />);
    const dots = screen.getAllByTestId('reference-dot');
    const firstCross = dots.find(el => el.getAttribute('data-x') === '50');
    expect(firstCross).toBeUndefined();
  });
});
