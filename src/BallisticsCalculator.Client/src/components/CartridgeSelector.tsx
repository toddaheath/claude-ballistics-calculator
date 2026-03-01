import { useMemo } from 'react';
import type { Cartridge } from '../types';

interface Props {
  cartridges: Cartridge[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const categoryOrder = ['Handgun', 'Intermediate', 'Standard Rifle', 'Magnum'];

export default function CartridgeSelector({ cartridges, selectedId, onSelect }: Props) {
  const grouped = useMemo(() => cartridges.reduce<Record<string, Cartridge[]>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {}), [cartridges]);

  return (
    <div className="cartridge-selector">
      <label htmlFor="cartridge-select">Select Cartridge:</label>
      <select
        id="cartridge-select"
        value={selectedId ?? ''}
        onChange={(e) => onSelect(Number(e.target.value))}
        disabled={cartridges.length === 0}
      >
        <option value="" disabled>-- Choose a load --</option>
        {categoryOrder.map((cat) =>
          grouped[cat] ? (
            <optgroup key={cat} label={cat}>
              {grouped[cat].map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.bulletWeightGrains}gr {c.bulletType})
                </option>
              ))}
            </optgroup>
          ) : null
        )}
      </select>
    </div>
  );
}
