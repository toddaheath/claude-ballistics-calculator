import type { TrajectoryResponse } from '../types';

interface Props {
  data: TrajectoryResponse;
}

export default function TrajectoryInfo({ data }: Props) {
  const isMetric = data.unitSystem === 'meters';
  const rangeUnit = isMetric ? 'm' : 'yd';
  const heightUnit = isMetric ? 'cm' : 'in';
  const velocityUnit = isMetric ? 'm/s' : 'fps';

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
        </tbody>
      </table>
    </div>
  );
}
