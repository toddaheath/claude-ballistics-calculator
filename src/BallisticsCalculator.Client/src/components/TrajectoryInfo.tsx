import { useState, useEffect, useMemo, memo } from 'react';
import type { TrajectoryResponse, EnvironmentSettings, MpbrResponse } from '../types';
import { downloadDopeCard, calculateMpbr } from '../services/api';

interface Props {
  data: TrajectoryResponse;
  settings: EnvironmentSettings;
  cartridgeId: number;
  maxRange: number;
}

function TrajectoryInfo({ data, settings, cartridgeId, maxRange }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [mpbr, setMpbr] = useState<MpbrResponse | null>(null);
  const [mpbrLoading, setMpbrLoading] = useState(false);
  const [mpbrError, setMpbrError] = useState(false);

  useEffect(() => {
    setMpbr(null);
    setMpbrError(false);
    setDownloadError(false);
  }, [cartridgeId]);

  const handleCalculateMpbr = async () => {
    setMpbrLoading(true);
    setMpbrError(false);
    try {
      const result = await calculateMpbr({
        cartridgeId,
        vitalZoneRadiusInches: 3.0,
        sightHeightInches: settings.sightHeightInches,
        dragModel: settings.dragModel,
        unitSystem: data.unitSystem,
      });
      setMpbr(result);
    } catch {
      setMpbrError(true);
    } finally {
      setMpbrLoading(false);
    }
  };

  const handleDownloadDope = async () => {
    setDownloading(true);
    setDownloadError(false);
    try {
      const blob = await downloadDopeCard({
        cartridgeId,
        unitSystem: data.unitSystem,
        maxRange,
        zeroRange: settings.zeroRange,
        shotHeightInches: settings.shotHeightInches,
        sightHeightInches: settings.sightHeightInches,
        windSpeedMph: settings.windSpeedMph,
        windDirectionDeg: settings.windDirectionDeg,
        temperatureF: settings.temperatureF,
        altitudeFt: settings.altitudeFt,
        pressureInHg: settings.pressureInHg,
        humidityPercent: settings.humidityPercent,
        shootingAngleDeg: settings.shootingAngleDeg,
        dragModel: settings.dragModel,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dope-card-${data.cartridgeName.replace(/[^a-zA-Z0-9]/g, '-')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  };

  const isMetric = data.unitSystem === 'meters';
  const rangeUnit = isMetric ? 'm' : 'yd';
  const heightUnit = isMetric ? 'cm' : 'in';
  const velocityUnit = isMetric ? 'm/s' : 'fps';

  const windDisplay =
    settings.windSpeedMph > 0
      ? `${settings.windSpeedMph} mph at ${settings.windDirectionDeg}\u00B0`
      : 'None';

  const angleDisplay =
    settings.shootingAngleDeg !== 0
      ? `${settings.shootingAngleDeg}\u00B0`
      : 'Level';

  const transonicDisplay =
    (data.transonicRange ?? 0) > 0
      ? `${data.transonicRange.toFixed(0)} ${rangeUnit}`
      : 'Beyond max range';

  // Build drop table at key intervals:
  // every 50 out to 500, then every 100 beyond that
  const dropTablePoints = useMemo(
    () => data.points.filter((p) => {
      if (p.range === 0) return false;
      if (p.range <= 500) return p.range % 50 === 0;
      return p.range % 100 === 0;
    }),
    [data.points]
  );

  return (
    <div className="trajectory-info">
      <h3>Shot Details</h3>
      <table>
        <tbody>
          <tr>
            <th scope="row">Cartridge</th>
            <td>{data.cartridgeName}</td>
          </tr>
          <tr>
            <th scope="row">Muzzle Velocity</th>
            <td>{data.muzzleVelocity.toFixed(0)} {velocityUnit}</td>
          </tr>
          <tr>
            <th scope="row">Bore Elevation Angle</th>
            <td>{data.boreElevationAngleMOA.toFixed(2)} MOA</td>
          </tr>
          <tr>
            <th scope="row">Zero Range</th>
            <td>{data.zeroRange.toFixed(0)} {rangeUnit}</td>
          </tr>
          <tr>
            <th scope="row">Shot Height</th>
            <td>{data.shotHeight.toFixed(1)} {heightUnit}</td>
          </tr>
          <tr>
            <th scope="row">Height at 50 {rangeUnit}</th>
            <td>{data.heightAt50.toFixed(2)} {heightUnit}</td>
          </tr>
          <tr>
            <th scope="row">2nd Crossing Distance</th>
            <td>
              {data.secondCrossingRange > 0
                ? `${data.secondCrossingRange.toFixed(0)} ${rangeUnit}`
                : 'N/A (within max range)'}
            </td>
          </tr>
          <tr>
            <th scope="row">Wind</th>
            <td>{windDisplay}</td>
          </tr>
          <tr>
            <th scope="row">Temperature</th>
            <td>{settings.temperatureF}&deg;F</td>
          </tr>
          <tr>
            <th scope="row">Altitude</th>
            <td>{settings.altitudeFt} ft</td>
          </tr>
          <tr>
            <th scope="row">Shooting Angle</th>
            <td>{angleDisplay}</td>
          </tr>
          <tr>
            <th scope="row">Transonic Range</th>
            <td>{transonicDisplay}</td>
          </tr>
        </tbody>
      </table>

      <div className="mpbr-section">
        <h3 style={{ marginTop: 24 }}>Maximum Point-Blank Range</h3>
        {mpbrError && (
          <div className="error" role="alert">Failed to calculate MPBR. Please try again.</div>
        )}
        {!mpbr ? (
          <button
            className="mpbr-calc-btn"
            onClick={handleCalculateMpbr}
            disabled={mpbrLoading}
          >
            {mpbrLoading ? 'Calculating...' : 'Calculate MPBR (6" vital zone)'}
          </button>
        ) : (
          <table>
            <tbody>
              <tr>
                <th scope="row">MPBR</th>
                <td>{mpbr.mpbrRange.toFixed(0)} {rangeUnit}</td>
              </tr>
              <tr>
                <th scope="row">Optimal Zero</th>
                <td>{mpbr.optimalZeroRange.toFixed(0)} {rangeUnit}</td>
              </tr>
              <tr>
                <th scope="row">Vital Zone</th>
                <td>&plusmn;{mpbr.vitalZoneRadiusInches.toFixed(1)} {heightUnit}</td>
              </tr>
              <tr>
                <th scope="row">Near Zero</th>
                <td>{mpbr.nearZeroCrossing.toFixed(0)} {rangeUnit}</td>
              </tr>
              <tr>
                <th scope="row">Far Zero</th>
                <td>{mpbr.farZeroCrossing.toFixed(0)} {rangeUnit}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {dropTablePoints.length > 0 && (
        <>
          <h3 style={{ marginTop: 24 }}>Drop Table</h3>
          <div className="drop-table-wrapper">
            <table className="drop-table">
              <thead>
                <tr>
                  <th scope="col">Range</th>
                  <th scope="col">Drop (MOA)</th>
                  <th scope="col">Drop (Mil)</th>
                  <th scope="col">Wind (MOA)</th>
                  <th scope="col">Wind (Mil)</th>
                </tr>
              </thead>
              <tbody>
                {dropTablePoints.map((p) => (
                  <tr key={p.range} className={p.isTransonic ? 'transonic-row' : ''}>
                    <td>{p.range.toFixed(0)} {rangeUnit}</td>
                    <td>{p.dropMoa.toFixed(2)}</td>
                    <td>{p.dropMils.toFixed(2)}</td>
                    <td>{p.windDriftMoa.toFixed(2)}</td>
                    <td>{p.windDriftMils.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {cartridgeId !== 0 && (
        <>
          {downloadError && (
            <div className="error" role="alert" style={{ marginTop: 12 }}>Failed to download DOPE card. Please try again.</div>
          )}
          <button
            className="dope-download-btn"
            onClick={handleDownloadDope}
            disabled={downloading}
          >
            {downloading ? 'Downloading...' : 'Download DOPE Card'}
          </button>
        </>
      )}
    </div>
  );
}

export default memo(TrajectoryInfo);
