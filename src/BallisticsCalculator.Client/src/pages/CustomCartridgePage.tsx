import { useState } from 'react';
import TrajectoryChart from '../components/TrajectoryChart';
import TrajectoryInfo from '../components/TrajectoryInfo';
import UnitToggle from '../components/UnitToggle';
import { calculateCustomTrajectory } from '../services/api';
import type { EnvironmentSettings, TrajectoryResponse, UnitSystem } from '../types';

export default function CustomCartridgePage() {
  const [name, setName] = useState('Custom Load');
  const [bulletWeight, setBulletWeight] = useState(168);
  const [muzzleVelocity, setMuzzleVelocity] = useState(2680);
  const [bc, setBc] = useState(0.462);
  const [bulletDiameter, setBulletDiameter] = useState(0.308);
  const [bulletType, setBulletType] = useState('BTHP');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('yards');
  const [maxRange, setMaxRange] = useState(500);
  const [dragModel, setDragModel] = useState('G1');
  const [trajectory, setTrajectory] = useState<TrajectoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settings: EnvironmentSettings = {
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
    dragModel,
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await calculateCustomTrajectory({
        name,
        bulletWeightGrains: bulletWeight,
        muzzleVelocityFps: muzzleVelocity,
        ballisticCoefficient: bc,
        bulletDiameterInches: bulletDiameter,
        bulletType,
        unitSystem,
        maxRange,
        dragModel,
        zeroRange: settings.zeroRange,
        shotHeightInches: settings.shotHeightInches,
        sightHeightInches: settings.sightHeightInches,
      });
      setTrajectory(result);
    } catch {
      setError('Failed to calculate trajectory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Custom Cartridge</h2>
        <p>Enter your load data to calculate trajectory.</p>
      </div>

      <div className="custom-cartridge-form">
        <div className="custom-form-grid">
          <div className="env-field">
            <label htmlFor="custom-name">Load Name</label>
            <input id="custom-name" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="off" />
          </div>
          <div className="env-field">
            <label htmlFor="custom-weight">Bullet Weight (<abbr title="grains">gr</abbr>)</label>
            <input id="custom-weight" type="number" min={10} max={1000} step={1} value={bulletWeight} onChange={(e) => setBulletWeight(Number(e.target.value))} autoComplete="off" />
          </div>
          <div className="env-field">
            <label htmlFor="custom-mv">Muzzle Velocity (<abbr title="feet per second">fps</abbr>)</label>
            <input id="custom-mv" type="number" min={100} max={5000} step={10} value={muzzleVelocity} onChange={(e) => setMuzzleVelocity(Number(e.target.value))} autoComplete="off" />
          </div>
          <div className="env-field">
            <label htmlFor="custom-bc">Ballistic Coefficient</label>
            <input id="custom-bc" type="number" min={0.01} max={2.0} step={0.001} value={bc} onChange={(e) => setBc(Number(e.target.value))} autoComplete="off" />
          </div>
          <div className="env-field">
            <label htmlFor="custom-diameter">Bullet Diameter (<abbr title="inches">in</abbr>)</label>
            <input id="custom-diameter" type="number" min={0.1} max={1.0} step={0.001} value={bulletDiameter} onChange={(e) => setBulletDiameter(Number(e.target.value))} autoComplete="off" />
          </div>
          <div className="env-field">
            <label htmlFor="custom-type">Bullet Type</label>
            <input id="custom-type" type="text" value={bulletType} onChange={(e) => setBulletType(e.target.value)} maxLength={50} autoComplete="off" />
          </div>
          <div className="env-field">
            <label htmlFor="custom-drag">Drag Model</label>
            <select id="custom-drag" value={dragModel} onChange={(e) => setDragModel(e.target.value)}>
              <option value="G1">G1 (flat base)</option>
              <option value="G7">G7 (boat tail)</option>
            </select>
          </div>
          <div className="env-field">
            <label htmlFor="custom-range">Max Range (<abbr title="yards">yd</abbr>)</label>
            <input id="custom-range" type="number" min={10} max={3000} step={50} value={maxRange} onChange={(e) => setMaxRange(Number(e.target.value))} autoComplete="off" />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <UnitToggle unitSystem={unitSystem} onChange={setUnitSystem} />
        </div>

        <button
          type="button"
          className="compare-btn"
          onClick={handleCalculate}
          disabled={loading}
          aria-busy={loading}
          style={{ marginTop: 16 }}
        >
          {loading ? 'Calculating...' : 'Calculate Trajectory'}
        </button>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      {trajectory && !loading && (
        <>
          <TrajectoryChart
            data={trajectory}
            maxRange={maxRange}
            unitSystem={unitSystem}
            onMaxRangeChange={setMaxRange}
          />
          <TrajectoryInfo data={trajectory} settings={settings} cartridgeId={0} maxRange={maxRange} />
        </>
      )}
    </>
  );
}
