import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import EnvironmentPanel from '../EnvironmentPanel';
import type { EnvironmentSettings } from '../../types';

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

describe('EnvironmentPanel', () => {
  it('renders the toggle button', () => {
    render(<EnvironmentPanel settings={defaultSettings} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('starts collapsed', () => {
    render(<EnvironmentPanel settings={defaultSettings} onChange={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByLabelText('Wind Speed (mph)')).not.toBeInTheDocument();
  });

  it('expands when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<EnvironmentPanel settings={defaultSettings} onChange={() => {}} />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText('Wind Speed (mph)')).toBeInTheDocument();
  });

  it('shows all three sections when expanded', async () => {
    const user = userEvent.setup();
    render(<EnvironmentPanel settings={defaultSettings} onChange={() => {}} />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Wind')).toBeInTheDocument();
    expect(screen.getByText('Atmosphere')).toBeInTheDocument();
    expect(screen.getByText('Shot Setup')).toBeInTheDocument();
  });

  it('displays current wind speed value', async () => {
    const user = userEvent.setup();
    const settings = { ...defaultSettings, windSpeedMph: 10 };
    render(<EnvironmentPanel settings={settings} onChange={() => {}} />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByLabelText('Wind Speed (mph)')).toHaveValue(10);
  });

  it('calls onChange when wind speed changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EnvironmentPanel settings={defaultSettings} onChange={onChange} />);

    await user.click(screen.getByRole('button'));
    const input = screen.getByLabelText('Wind Speed (mph)');
    await user.clear(input);
    await user.type(input, '5');

    // onChange should be called with updated windSpeedMph
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.windSpeedMph).toBe(5);
  });

  it('displays drag model selector with G1 and G7 options', async () => {
    const user = userEvent.setup();
    render(<EnvironmentPanel settings={defaultSettings} onChange={() => {}} />);

    await user.click(screen.getByRole('button'));
    const dragSelect = screen.getByLabelText('Drag Model');
    expect(dragSelect).toHaveValue('G1');
    expect(screen.getByText('G1 (flat base)')).toBeInTheDocument();
    expect(screen.getByText('G7 (boat tail)')).toBeInTheDocument();
  });

  it('calls onChange when drag model changes to G7', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EnvironmentPanel settings={defaultSettings} onChange={onChange} />);

    await user.click(screen.getByRole('button'));
    await user.selectOptions(screen.getByLabelText('Drag Model'), 'G7');

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.dragModel).toBe('G7');
  });

  it('displays all atmosphere fields', async () => {
    const user = userEvent.setup();
    render(<EnvironmentPanel settings={defaultSettings} onChange={() => {}} />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByLabelText(/temperature/i)).toHaveValue(59);
    expect(screen.getByLabelText(/altitude/i)).toHaveValue(0);
    expect(screen.getByLabelText(/pressure/i)).toHaveValue(29.92);
    expect(screen.getByLabelText(/humidity/i)).toHaveValue(0);
  });

  it('displays all shot setup fields', async () => {
    const user = userEvent.setup();
    render(<EnvironmentPanel settings={defaultSettings} onChange={() => {}} />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByLabelText(/zero range/i)).toHaveValue(100);
    expect(screen.getByLabelText(/sight height/i)).toHaveValue(1.5);
    expect(screen.getByLabelText(/shot height/i)).toHaveValue(30);
    expect(screen.getByLabelText(/shooting angle/i)).toHaveValue(0);
  });

  it('collapses when toggle is clicked again', async () => {
    const user = userEvent.setup();
    render(<EnvironmentPanel settings={defaultSettings} onChange={() => {}} />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByLabelText('Wind Speed (mph)')).toBeInTheDocument();

    await user.click(screen.getByRole('button'));
    expect(screen.queryByLabelText('Wind Speed (mph)')).not.toBeInTheDocument();
  });
});
