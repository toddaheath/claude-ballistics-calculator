import type { UnitSystem } from '../types';

interface Props {
  unitSystem: UnitSystem;
  onChange: (unit: UnitSystem) => void;
}

export default function UnitToggle({ unitSystem, onChange }: Props) {
  return (
    <div className="unit-toggle">
      <button
        className={unitSystem === 'yards' ? 'active' : ''}
        aria-pressed={unitSystem === 'yards'}
        onClick={() => onChange('yards')}
      >
        Yards / Imperial
      </button>
      <button
        className={unitSystem === 'meters' ? 'active' : ''}
        aria-pressed={unitSystem === 'meters'}
        onClick={() => onChange('meters')}
      >
        Meters / Metric
      </button>
    </div>
  );
}
