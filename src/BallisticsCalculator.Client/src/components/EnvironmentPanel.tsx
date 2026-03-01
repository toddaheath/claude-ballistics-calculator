import { useState } from 'react';
import type { EnvironmentSettings } from '../types';

interface Props {
  settings: EnvironmentSettings;
  onChange: (settings: EnvironmentSettings) => void;
}

export default function EnvironmentPanel({ settings, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  const update = (patch: Partial<EnvironmentSettings>) => {
    onChange({ ...settings, ...patch });
  };

  return (
    <div className="environment-panel">
      <button
        type="button"
        className="environment-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls="environment-settings"
      >
        Settings {expanded ? '\u25B4' : '\u25BE'}
      </button>

      {expanded && (
        <div className="environment-sections" id="environment-settings" role="region" aria-label="Environment settings">
          {/* Wind */}
          <div className="env-section">
            <h4 className="env-section-title">Wind</h4>
            <div className="environment-grid">
              <div className="env-field">
                <label htmlFor="env-wind-speed">Wind Speed (mph)</label>
                <input
                  id="env-wind-speed"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={settings.windSpeedMph}
                  onChange={(e) => update({ windSpeedMph: Number(e.target.value) })}
                />
              </div>
              <div className="env-field">
                <label htmlFor="env-wind-dir">Wind Direction (&deg;)</label>
                <input
                  id="env-wind-dir"
                  type="number"
                  min={0}
                  max={360}
                  step={15}
                  value={settings.windDirectionDeg}
                  onChange={(e) => update({ windDirectionDeg: Number(e.target.value) })}
                  aria-describedby="wind-dir-hint"
                />
                <span id="wind-dir-hint" className="env-hint">0&deg;=head, 90&deg;=right, 180&deg;=tail, 270&deg;=left</span>
              </div>
            </div>
          </div>

          {/* Atmosphere */}
          <div className="env-section">
            <h4 className="env-section-title">Atmosphere</h4>
            <div className="environment-grid">
              <div className="env-field">
                <label htmlFor="env-temp">Temperature (&deg;F)</label>
                <input
                  id="env-temp"
                  type="number"
                  min={-40}
                  max={140}
                  step={1}
                  value={settings.temperatureF}
                  onChange={(e) => update({ temperatureF: Number(e.target.value) })}
                />
              </div>
              <div className="env-field">
                <label htmlFor="env-altitude">Altitude (ft)</label>
                <input
                  id="env-altitude"
                  type="number"
                  min={0}
                  max={30000}
                  step={100}
                  value={settings.altitudeFt}
                  onChange={(e) => update({ altitudeFt: Number(e.target.value) })}
                />
              </div>
              <div className="env-field">
                <label htmlFor="env-pressure">Pressure (inHg)</label>
                <input
                  id="env-pressure"
                  type="number"
                  min={20}
                  max={35}
                  step={0.01}
                  value={settings.pressureInHg}
                  onChange={(e) => update({ pressureInHg: Number(e.target.value) })}
                />
              </div>
              <div className="env-field">
                <label htmlFor="env-humidity">Humidity (%)</label>
                <input
                  id="env-humidity"
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  value={settings.humidityPercent}
                  onChange={(e) => update({ humidityPercent: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Shot Setup */}
          <div className="env-section">
            <h4 className="env-section-title">Shot Setup</h4>
            <div className="environment-grid">
              <div className="env-field">
                <label htmlFor="env-zero-range">Zero Range (yd)</label>
                <input
                  id="env-zero-range"
                  type="number"
                  min={10}
                  max={1000}
                  step={25}
                  value={settings.zeroRange}
                  onChange={(e) => update({ zeroRange: Number(e.target.value) })}
                />
              </div>
              <div className="env-field">
                <label htmlFor="env-sight-height">Sight Height (in)</label>
                <input
                  id="env-sight-height"
                  type="number"
                  min={0.5}
                  max={6}
                  step={0.1}
                  value={settings.sightHeightInches}
                  onChange={(e) => update({ sightHeightInches: Number(e.target.value) })}
                />
              </div>
              <div className="env-field">
                <label htmlFor="env-shot-height">Shot Height (in)</label>
                <input
                  id="env-shot-height"
                  type="number"
                  min={0}
                  max={240}
                  step={1}
                  value={settings.shotHeightInches}
                  onChange={(e) => update({ shotHeightInches: Number(e.target.value) })}
                />
              </div>
              <div className="env-field">
                <label htmlFor="env-angle">Shooting Angle (&deg;)</label>
                <input
                  id="env-angle"
                  type="number"
                  min={-90}
                  max={90}
                  step={5}
                  value={settings.shootingAngleDeg}
                  onChange={(e) => update({ shootingAngleDeg: Number(e.target.value) })}
                />
              </div>
              <div className="env-field">
                <label htmlFor="env-drag-model">Drag Model</label>
                <select
                  id="env-drag-model"
                  value={settings.dragModel}
                  onChange={(e) => update({ dragModel: e.target.value })}
                >
                  <option value="G1">G1 (flat base)</option>
                  <option value="G7">G7 (boat tail)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
