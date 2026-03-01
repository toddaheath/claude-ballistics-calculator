import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TrajectoryInfo from '../TrajectoryInfo';
import type { TrajectoryResponse, EnvironmentSettings } from '../../types';

vi.mock('../../services/api', () => ({
  downloadDopeCard: vi.fn(),
  calculateMpbr: vi.fn(),
}));

import { calculateMpbr, downloadDopeCard } from '../../services/api';

const mockedCalculateMpbr = vi.mocked(calculateMpbr);
const mockedDownloadDopeCard = vi.mocked(downloadDopeCard);

const defaultSettings: EnvironmentSettings = {
  windSpeedMph: 0,
  windDirectionDeg: 90,
  temperatureF: 59,
  altitudeFt: 0,
  pressureInHg: 29.92,
  humidityPercent: 0,
  zeroRange: 100,
  sightHeightInches: 1.5,
  shotHeightInches: 30,
  shootingAngleDeg: 0,
  dragModel: 'G1',
};

const sampleData: TrajectoryResponse = {
  points: [
    {
      range: 0, height: 30, velocity: 2820, energy: 2648,
      timeOfFlight: 0, mach: 2.52, drop: 0, windDriftInches: 0,
      dropMoa: 0, dropMils: 0, windDriftMoa: 0, windDriftMils: 0, isTransonic: false,
    },
    {
      range: 100, height: 0, velocity: 2624, energy: 2293,
      timeOfFlight: 0.11, mach: 2.35, drop: -1.5, windDriftInches: 0.3,
      dropMoa: -1.43, dropMils: -0.42, windDriftMoa: 0.29, windDriftMils: 0.08, isTransonic: false,
    },
    {
      range: 200, height: -3.2, velocity: 2437, energy: 1978,
      timeOfFlight: 0.23, mach: 2.18, drop: -7.2, windDriftInches: 1.2,
      dropMoa: -3.44, dropMils: -1.00, windDriftMoa: 0.57, windDriftMils: 0.17, isTransonic: false,
    },
    {
      range: 500, height: -42.5, velocity: 1912, energy: 1218,
      timeOfFlight: 0.62, mach: 1.71, drop: -72.5, windDriftInches: 8.9,
      dropMoa: -13.85, dropMils: -4.03, windDriftMoa: 1.70, windDriftMils: 0.49, isTransonic: false,
    },
  ],
  zeroRange: 100,
  muzzleVelocity: 2820,
  maxRange: 500,
  cartridgeName: '.308 Win 168gr BTHP',
  boreElevationAngleMOA: 1.43,
  heightAt50: 0.65,
  secondCrossingRange: 0,
  shotHeight: 30,
  unitSystem: 'yards',
  transonicRange: 0,
  dragModel: 'G1',
};

describe('TrajectoryInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders shot details table', () => {
    render(
      <TrajectoryInfo
        data={sampleData}
        settings={defaultSettings}
        cartridgeId={29}
        maxRange={500}
      />
    );

    expect(screen.getByText('Shot Details')).toBeInTheDocument();
    expect(screen.getByText('.308 Win 168gr BTHP')).toBeInTheDocument();
    expect(screen.getByText('2820 fps')).toBeInTheDocument();
    expect(screen.getByText((_content, el) => el?.tagName === 'TD' && el.textContent === '1.43 MOA')).toBeInTheDocument();
    // "100 yd" appears in both Shot Details (Zero Range) and Drop Table
    expect(screen.getAllByText('100 yd').length).toBeGreaterThanOrEqual(1);
  });

  it('shows wind as None when speed is 0', () => {
    render(
      <TrajectoryInfo
        data={sampleData}
        settings={defaultSettings}
        cartridgeId={29}
        maxRange={500}
      />
    );

    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('shows wind details when speed > 0', () => {
    const windSettings = { ...defaultSettings, windSpeedMph: 10, windDirectionDeg: 90 };
    render(
      <TrajectoryInfo
        data={sampleData}
        settings={windSettings}
        cartridgeId={29}
        maxRange={500}
      />
    );

    expect(screen.getByText('10 mph at 90\u00B0')).toBeInTheDocument();
  });

  it('shows Level when shooting angle is 0', () => {
    render(
      <TrajectoryInfo
        data={sampleData}
        settings={defaultSettings}
        cartridgeId={29}
        maxRange={500}
      />
    );

    expect(screen.getByText('Level')).toBeInTheDocument();
  });

  it('shows angle when shooting angle is non-zero', () => {
    const angleSettings = { ...defaultSettings, shootingAngleDeg: 15 };
    render(
      <TrajectoryInfo
        data={sampleData}
        settings={angleSettings}
        cartridgeId={29}
        maxRange={500}
      />
    );

    expect(screen.getByText('15\u00B0')).toBeInTheDocument();
  });

  it('shows Beyond max range when transonic range is 0', () => {
    render(
      <TrajectoryInfo
        data={sampleData}
        settings={defaultSettings}
        cartridgeId={29}
        maxRange={500}
      />
    );

    expect(screen.getByText('Beyond max range')).toBeInTheDocument();
  });

  it('shows transonic range when > 0', () => {
    const dataWithTransonic = { ...sampleData, transonicRange: 875 };
    render(
      <TrajectoryInfo
        data={dataWithTransonic}
        settings={defaultSettings}
        cartridgeId={29}
        maxRange={1000}
      />
    );

    expect(screen.getByText('875 yd')).toBeInTheDocument();
  });

  it('uses metric units when unitSystem is meters', () => {
    const metricData = { ...sampleData, unitSystem: 'meters' as const };
    render(
      <TrajectoryInfo
        data={metricData}
        settings={defaultSettings}
        cartridgeId={29}
        maxRange={500}
      />
    );

    expect(screen.getByText('2820 m/s')).toBeInTheDocument();
    // "100 m" appears in both Shot Details and Drop Table
    expect(screen.getAllByText('100 m').length).toBeGreaterThanOrEqual(1);
  });

  it('renders MPBR calculate button', () => {
    render(
      <TrajectoryInfo
        data={sampleData}
        settings={defaultSettings}
        cartridgeId={29}
        maxRange={500}
      />
    );

    expect(screen.getByText('Maximum Point-Blank Range')).toBeInTheDocument();
    expect(screen.getByText(/calculate mpbr/i)).toBeInTheDocument();
  });

  it('shows MPBR results after calculation', async () => {
    const user = userEvent.setup();
    mockedCalculateMpbr.mockResolvedValue({
      mpbrRange: 268,
      optimalZeroRange: 228,
      vitalZoneRadiusInches: 3.0,
      nearZeroCrossing: 25,
      farZeroCrossing: 228,
      cartridgeName: '.308 Win',
      unitSystem: 'yards',
      dragModel: 'G1',
    });

    render(
      <TrajectoryInfo
        data={sampleData}
        settings={defaultSettings}
        cartridgeId={29}
        maxRange={500}
      />
    );

    await user.click(screen.getByText(/calculate mpbr/i));

    expect(await screen.findByText('268 yd')).toBeInTheDocument();
    // 228 yd appears for both Optimal Zero and Far Zero
    expect(screen.getAllByText('228 yd').length).toBe(2);
  });

  it('renders drop table for points at 50-yard intervals', () => {
    render(
      <TrajectoryInfo
        data={sampleData}
        settings={defaultSettings}
        cartridgeId={29}
        maxRange={500}
      />
    );

    expect(screen.getByText('Drop Table')).toBeInTheDocument();
    // Check headers
    expect(screen.getByText((_content, el) => el?.tagName === 'TH' && el.textContent === 'Drop (MOA)')).toBeInTheDocument();
    expect(screen.getByText((_content, el) => el?.tagName === 'TH' && el.textContent === 'Drop (Mil)')).toBeInTheDocument();
    expect(screen.getByText((_content, el) => el?.tagName === 'TH' && el.textContent === 'Wind (MOA)')).toBeInTheDocument();
    expect(screen.getByText((_content, el) => el?.tagName === 'TH' && el.textContent === 'Wind (Mil)')).toBeInTheDocument();
  });

  it('shows download DOPE card button for real cartridges', () => {
    render(
      <TrajectoryInfo
        data={sampleData}
        settings={defaultSettings}
        cartridgeId={29}
        maxRange={500}
      />
    );

    expect(screen.getByText('Download DOPE Card')).toBeInTheDocument();
  });

  it('hides download button when cartridgeId is 0', () => {
    render(
      <TrajectoryInfo
        data={sampleData}
        settings={defaultSettings}
        cartridgeId={0}
        maxRange={500}
      />
    );

    expect(screen.queryByText('Download DOPE Card')).not.toBeInTheDocument();
  });

  it('shows error when MPBR calculation fails', async () => {
    const user = userEvent.setup();
    mockedCalculateMpbr.mockRejectedValue(new Error('API error'));

    render(
      <TrajectoryInfo
        data={sampleData}
        settings={defaultSettings}
        cartridgeId={29}
        maxRange={500}
      />
    );

    await user.click(screen.getByRole('button', { name: /calculate mpbr/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to calculate mpbr/i);
    expect(screen.getByRole('button', { name: /calculate mpbr/i })).not.toBeDisabled();
  });

  it('shows error when DOPE card download fails', async () => {
    const user = userEvent.setup();
    mockedDownloadDopeCard.mockRejectedValue(new Error('Network error'));

    render(
      <TrajectoryInfo
        data={sampleData}
        settings={defaultSettings}
        cartridgeId={29}
        maxRange={500}
      />
    );

    await user.click(screen.getByText('Download DOPE Card'));

    expect(await screen.findByText(/failed to download dope card/i)).toBeInTheDocument();
    expect(screen.getByText('Download DOPE Card')).not.toBeDisabled();
  });

  it('clears MPBR error on retry', async () => {
    const user = userEvent.setup();
    mockedCalculateMpbr
      .mockRejectedValueOnce(new Error('API error'))
      .mockResolvedValueOnce({
        mpbrRange: 268,
        optimalZeroRange: 228,
        vitalZoneRadiusInches: 3.0,
        nearZeroCrossing: 25,
        farZeroCrossing: 228,
        cartridgeName: '.308 Win',
        unitSystem: 'yards',
        dragModel: 'G1',
      });

    render(
      <TrajectoryInfo
        data={sampleData}
        settings={defaultSettings}
        cartridgeId={29}
        maxRange={500}
      />
    );

    await user.click(screen.getByRole('button', { name: /calculate mpbr/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to calculate mpbr/i);

    await user.click(screen.getByRole('button', { name: /calculate mpbr/i }));
    expect(await screen.findByText('268 yd')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
