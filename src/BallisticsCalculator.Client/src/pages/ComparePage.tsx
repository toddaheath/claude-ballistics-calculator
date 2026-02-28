import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Label
} from 'recharts';
import type { Cartridge, CompareResponse, UnitSystem } from '../types';
import { getCartridges, compareTrajectories } from '../services/api';

const COLORS = ['#2980b9', '#e74c3c', '#27ae60', '#f39c12', '#8e44ad'];

const categoryOrder = ['Handgun', 'Intermediate', 'Standard Rifle', 'Magnum'];

export default function ComparePage() {
  const [cartridges, setCartridges] = useState<Cartridge[]>([]);
  const [selectedIds, setSelectedIds] = useState<(number | null)[]>([null, null]);
  const [compareData, setCompareData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('yards');

  useEffect(() => {
    getCartridges()
      .then(setCartridges)
      .catch(() => setError('Failed to load cartridges'));
  }, []);

  const grouped = useMemo(() => cartridges.reduce<Record<string, Cartridge[]>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {}), [cartridges]);

  const handleSelectorChange = useCallback((index: number, value: number | null) => {
    setSelectedIds((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleAddCartridge = useCallback(() => {
    if (selectedIds.length < 5) {
      setSelectedIds((prev) => [...prev, null]);
    }
  }, [selectedIds.length]);

  const handleRemoveCartridge = useCallback((index: number) => {
    if (selectedIds.length > 2) {
      setSelectedIds((prev) => prev.filter((_, i) => i !== index));
    }
  }, [selectedIds.length]);

  const validIds = selectedIds.filter((id): id is number => id !== null);

  const handleCompare = useCallback(async () => {
    if (validIds.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const result = await compareTrajectories({
        cartridgeIds: validIds,
        unitSystem,
        zeroRange: 100,
        maxRange: 500,
      });
      setCompareData(result);
    } catch {
      setError('Failed to compare trajectories');
    } finally {
      setLoading(false);
    }
  }, [validIds, unitSystem]);

  const isMetric = unitSystem === 'meters';
  const rangeLabel = isMetric ? 'Range (m)' : 'Range (yards)';
  const heightLabel = isMetric ? 'Height (cm)' : 'Height (inches)';
  const unit = isMetric ? 'm' : 'yd';
  const heightUnit = isMetric ? 'cm' : 'in';

  // Merge trajectories into unified chart data
  const chartData = useMemo(() => {
    if (!compareData) return [];

    // Get all unique ranges from all trajectories
    const rangeSet = new Set<number>();
    compareData.trajectories.forEach(t => {
      t.points.forEach(p => rangeSet.add(p.range));
    });

    const ranges = Array.from(rangeSet).sort((a, b) => a - b);

    // Downsample to every 5th point
    const sampled = ranges.filter((_, i) => i % 5 === 0);

    return sampled.map(range => {
      const row: Record<string, number> = { range };
      compareData.trajectories.forEach((t, idx) => {
        const point = t.points.find(p => Math.abs(p.range - range) < 1);
        if (point) {
          row[`height_${idx}`] = point.height;
        }
      });
      return row;
    });
  }, [compareData]);

  const cartridgeNames = useMemo(() => {
    if (!compareData) return [];
    return compareData.trajectories.map(t => t.cartridgeName);
  }, [compareData]);

  return (
    <div className="compare-page">
      <div className="page-header">
        <h2>Compare Trajectories</h2>
        <p>Select 2-5 cartridges to overlay their trajectory plots.</p>
      </div>

      <div className="compare-selectors">
        {selectedIds.map((id, index) => (
          <div key={index} className="compare-selector">
            <label htmlFor={`compare-select-${index}`}>#{index + 1}</label>
            <select
              id={`compare-select-${index}`}
              value={id ?? ''}
              onChange={(e) => handleSelectorChange(index, e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">-- Choose a load --</option>
              {categoryOrder.map((cat) =>
                grouped[cat] ? (
                  <optgroup key={cat} label={cat}>
                    {grouped[cat].map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null
              )}
            </select>
            {selectedIds.length > 2 && (
              <button
                className="remove-cartridge-btn"
                onClick={() => handleRemoveCartridge(index)}
                title="Remove"
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="compare-actions">
        {selectedIds.length < 5 && (
          <button className="add-cartridge-btn" onClick={handleAddCartridge}>
            + Add Cartridge
          </button>
        )}
        <div className="unit-toggle">
          <button
            className={unitSystem === 'yards' ? 'active' : ''}
            onClick={() => setUnitSystem('yards')}
          >
            Yards
          </button>
          <button
            className={unitSystem === 'meters' ? 'active' : ''}
            onClick={() => setUnitSystem('meters')}
          >
            Meters
          </button>
        </div>
        <button
          className="compare-btn"
          onClick={handleCompare}
          disabled={validIds.length < 2 || loading}
        >
          {loading ? 'Comparing...' : 'Compare'}
        </button>
      </div>

      {error && <div className="error" role="alert">{error}</div>}
      {loading && <div className="loading" role="status" aria-live="polite">Comparing trajectories...</div>}

      {compareData && !loading && chartData.length > 0 && (
        <div className="trajectory-chart">
          <div className="chart-header">
            <h3>Trajectory Comparison</h3>
          </div>
          <ResponsiveContainer width="100%" height={450}>
            <LineChart data={chartData} margin={{ top: 24, right: 48, left: 16, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
              <XAxis
                dataKey="range"
                type="number"
                domain={['dataMin', 'dataMax']}
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#ccc' }}
              >
                <Label value={rangeLabel} offset={-28} position="insideBottom" fontSize={13} fill="#444" />
              </XAxis>
              <YAxis tick={{ fontSize: 12 }} tickLine={{ stroke: '#ccc' }}>
                <Label
                  value={heightLabel}
                  angle={-90}
                  position="insideLeft"
                  offset={8}
                  style={{ textAnchor: 'middle' }}
                  fontSize={13}
                  fill="#444"
                />
              </YAxis>
              <Tooltip
                contentStyle={{ fontSize: 13, borderRadius: 6 }}
                formatter={(value: number, name: string) => {
                  const idx = parseInt(name.replace('height_', ''), 10);
                  const label = cartridgeNames[idx] ?? name;
                  return [`${value.toFixed(2)} ${heightUnit}`, label];
                }}
                labelFormatter={(label) => `Range: ${Number(label).toFixed(0)} ${unit}`}
              />
              <Legend
                verticalAlign="top"
                height={32}
                wrapperStyle={{ fontSize: 13 }}
                formatter={(value: string) => {
                  const idx = parseInt(value.replace('height_', ''), 10);
                  return cartridgeNames[idx] ?? value;
                }}
              />

              {compareData.trajectories.map((_, idx) => (
                <Line
                  key={idx}
                  type="monotone"
                  dataKey={`height_${idx}`}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2.5}
                  dot={false}
                  name={`height_${idx}`}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
