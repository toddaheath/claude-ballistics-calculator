import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import CartridgeSelector from '../CartridgeSelector';
import type { Cartridge } from '../../types';

const mockCartridges: Cartridge[] = [
  { id: 1, name: '9mm Luger', category: 'Handgun', bulletType: 'FMJ', bulletWeightGrains: 124, muzzleVelocityFps: 1150, ballisticCoefficientG1: 0.135 },
  { id: 2, name: '.308 Win', category: 'Standard Rifle', bulletType: 'BTHP', bulletWeightGrains: 168, muzzleVelocityFps: 2680, ballisticCoefficientG1: 0.462 },
  { id: 3, name: '.300 Win Mag', category: 'Magnum', bulletType: 'BTHP', bulletWeightGrains: 190, muzzleVelocityFps: 2900, ballisticCoefficientG1: 0.533 },
];

describe('CartridgeSelector', () => {
  it('renders the label and select element', () => {
    render(<CartridgeSelector cartridges={[]} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByLabelText('Select Cartridge:')).toBeInTheDocument();
  });

  it('shows the default placeholder option', () => {
    render(<CartridgeSelector cartridges={[]} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText('-- Choose a load --')).toBeInTheDocument();
  });

  it('renders cartridges grouped by category', () => {
    render(<CartridgeSelector cartridges={mockCartridges} selectedId={null} onSelect={() => {}} />);
    const select = screen.getByLabelText('Select Cartridge:');
    const optgroups = select.querySelectorAll('optgroup');
    const labels = Array.from(optgroups).map(g => g.getAttribute('label'));
    expect(labels).toContain('Handgun');
    expect(labels).toContain('Standard Rifle');
    expect(labels).toContain('Magnum');
  });

  it('renders cartridge names with weight and type', () => {
    render(<CartridgeSelector cartridges={mockCartridges} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText('9mm Luger (124gr FMJ)')).toBeInTheDocument();
    expect(screen.getByText('.308 Win (168gr BTHP)')).toBeInTheDocument();
  });

  it('calls onSelect with the selected cartridge id', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CartridgeSelector cartridges={mockCartridges} selectedId={null} onSelect={onSelect} />);

    await user.selectOptions(screen.getByLabelText('Select Cartridge:'), '2');
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('reflects the selected value', () => {
    render(<CartridgeSelector cartridges={mockCartridges} selectedId={2} onSelect={() => {}} />);
    expect(screen.getByLabelText('Select Cartridge:')).toHaveValue('2');
  });

  it('handles empty cartridges gracefully', () => {
    render(<CartridgeSelector cartridges={[]} selectedId={null} onSelect={() => {}} />);
    // Should only have the placeholder option
    const select = screen.getByLabelText('Select Cartridge:');
    expect(select.querySelectorAll('optgroup')).toHaveLength(0);
  });
});
