interface Props {
  unitSystem: string;
  onChange: (unit: string) => void;
}

export default function UnitToggle({ unitSystem, onChange }: Props) {
  return (
    <div className="unit-toggle">
      <button
        className={unitSystem === 'yards' ? 'active' : ''}
        onClick={() => onChange('yards')}
      >
        Yards / Imperial
      </button>
      <button
        className={unitSystem === 'meters' ? 'active' : ''}
        onClick={() => onChange('meters')}
      >
        Meters / Metric
      </button>
    </div>
  );
}
