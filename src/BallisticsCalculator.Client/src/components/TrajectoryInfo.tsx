import type { TrajectoryResponse, EnvironmentSettings } from '../types';

interface Props {
  data: TrajectoryResponse;
  settings: EnvironmentSettings;
}

export default function TrajectoryInfo({ data, settings }: Props) {
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
  const dropTablePoints = data.points.filter((p) => {
    if (p.range === 0) return false;
    if (p.range <= 500) return p.range % 50 === 0;
    return p.range % 100 === 0;
  });

  return (
    <div className="trajectory-info">
      <h3>Shot Details</h3>
      <table>
        <tbody>
          <tr>
            <td>Cartridge</td>
            <td>{data.cartridgeName}</td>
          </tr>
          <tr>
            <td>Muzzle Velocity</td>
            <td>{data.muzzleVelocity.toFixed(0)} {velocityUnit}</td>
          </tr>
          <tr>
            <td>Bore Elevation Angle</td>
            <td>{data.boreElevationAngleMOA.toFixed(2)} MOA</td>
          </tr>
          <tr>
            <td>Zero Range</td>
            <td>{data.zeroRange.toFixed(0)} {rangeUnit}</td>
          </tr>
          <tr>
            <td>Shot Height</td>
            <td>{data.shotHeight.toFixed(1)} {heightUnit}</td>
          </tr>
          <tr>
            <td>Height at 50 {rangeUnit}</td>
            <td>{data.heightAt50.toFixed(2)} {heightUnit}</td>
          </tr>
          <tr>
            <td>2nd Crossing Distance</td>
            <td>
              {data.secondCrossingRange > 0
                ? `${data.secondCrossingRange.toFixed(0)} ${rangeUnit}`
                : 'N/A (within max range)'}
            </td>
          </tr>
          <tr>
            <td>Wind</td>
            <td>{windDisplay}</td>
          </tr>
          <tr>
            <td>Temperature</td>
            <td>{settings.temperatureF}&deg;F</td>
          </tr>
          <tr>
            <td>Altitude</td>
            <td>{settings.altitudeFt} ft</td>
          </tr>
          <tr>
            <td>Shooting Angle</td>
            <td>{angleDisplay}</td>
          </tr>
          <tr>
            <td>Transonic Range</td>
            <td>{transonicDisplay}</td>
          </tr>
        </tbody>
      </table>

      {dropTablePoints.length > 0 && (
        <>
          <h3 style={{ marginTop: 24 }}>Drop Table</h3>
          <div className="drop-table-wrapper">
            <table className="drop-table">
              <thead>
                <tr>
                  <th>Range</th>
                  <th>Drop (MOA)</th>
                  <th>Drop (Mil)</th>
                  <th>Wind (MOA)</th>
                  <th>Wind (Mil)</th>
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
    </div>
  );
}
