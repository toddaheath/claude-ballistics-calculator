import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import UnitToggle from '../UnitToggle';

describe('UnitToggle', () => {
  it('renders both unit buttons', () => {
    render(<UnitToggle unitSystem="yards" onChange={() => {}} />);
    expect(screen.getByText('Yards / Imperial')).toBeInTheDocument();
    expect(screen.getByText('Meters / Metric')).toBeInTheDocument();
  });

  it('marks yards button as active when unitSystem is yards', () => {
    render(<UnitToggle unitSystem="yards" onChange={() => {}} />);
    expect(screen.getByText('Yards / Imperial')).toHaveClass('active');
    expect(screen.getByText('Meters / Metric')).not.toHaveClass('active');
  });

  it('marks meters button as active when unitSystem is meters', () => {
    render(<UnitToggle unitSystem="meters" onChange={() => {}} />);
    expect(screen.getByText('Meters / Metric')).toHaveClass('active');
    expect(screen.getByText('Yards / Imperial')).not.toHaveClass('active');
  });

  it('calls onChange with "meters" when clicking meters button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unitSystem="yards" onChange={onChange} />);

    await user.click(screen.getByText('Meters / Metric'));
    expect(onChange).toHaveBeenCalledWith('meters');
  });

  it('calls onChange with "yards" when clicking yards button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unitSystem="meters" onChange={onChange} />);

    await user.click(screen.getByText('Yards / Imperial'));
    expect(onChange).toHaveBeenCalledWith('yards');
  });

  it('sets aria-pressed correctly', () => {
    render(<UnitToggle unitSystem="yards" onChange={() => {}} />);
    expect(screen.getByText('Yards / Imperial')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Meters / Metric')).toHaveAttribute('aria-pressed', 'false');
  });
});
