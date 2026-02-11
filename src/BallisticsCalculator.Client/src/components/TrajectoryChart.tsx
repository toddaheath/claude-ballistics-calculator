import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, Legend, ResponsiveContainer, Label
} from 'recharts';
import { TrajectoryResponse } from '../types';

interface Props {
  data: TrajectoryResponse;
}

export default function TrajectoryChart({ data }: Props) {
  const isMetric = data.unitSystem === 'meters';
  const rangeLabel = isMetric ? 'Range (m)' : 'Range (yards)';
  const heightLabel = isMetric ? 'Height (cm)' : 'Height (inches)';

  // Downsample to every 5 units for chart performance
  const step = isMetric ? 5 : 5;
  const chartData = data.points.filter((_, i) => i % step === 0 || i === data.points.length - 1);

  // Find the second crossing point for annotation
  const crossingRange = data.secondCrossingRange;
  const crossingPoint = crossingRange > 0
    ? data.points.reduce((closest, p) =>
        Math.abs(p.range - crossingRange) < Math.abs(closest.range - crossingRange) ? p : closest
      , data.points[0])
    : null;

  return (
    <div className="trajectory-chart">
      <h3>Trajectory: {data.cartridgeName}</h3>
      <ResponsiveContainer width="100%" height={450}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="range" type="number" domain={['dataMin', 'dataMax']}>
            <Label value={rangeLabel} offset={-10} position="insideBottom" />
          </XAxis>
          <YAxis>
            <Label value={heightLabel} angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
          </YAxis>
          <Tooltip
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                height: `${value.toFixed(2)} ${isMetric ? 'cm' : 'in'}`,
                velocity: `${value.toFixed(0)} ${isMetric ? 'm/s' : 'fps'}`,
                energy: `${value.toFixed(0)} ${isMetric ? 'J' : 'ft-lbs'}`,
              };
              return labels[name] ?? value.toFixed(2);
            }}
            labelFormatter={(label) => `${rangeLabel.split(' ')[0]}: ${Number(label).toFixed(0)}`}
          />
          <Legend verticalAlign="top" />

          {/* Line of sight (zero line) */}
          <ReferenceLine y={0} stroke="#666" strokeDasharray="5 5" label="Line of Sight" />

          {/* Height at 50 yards/meters reference */}
          {data.heightAt50 !== 0 && (
            <ReferenceLine
              y={data.heightAt50}
              stroke="#ff7300"
              strokeDasharray="3 3"
              label={`Height @ 50${isMetric ? 'm' : 'yd'}: ${data.heightAt50.toFixed(2)}`}
            />
          )}

          {/* Second crossing range marker */}
          {crossingRange > 0 && (
            <ReferenceLine
              x={crossingRange}
              stroke="#e74c3c"
              strokeDasharray="4 4"
              label={`2nd crossing: ${crossingRange.toFixed(0)}${isMetric ? 'm' : 'yd'}`}
            />
          )}

          {/* Trajectory line */}
          <Line
            type="monotone"
            dataKey="height"
            stroke="#2980b9"
            strokeWidth={2}
            dot={false}
            name="height"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
