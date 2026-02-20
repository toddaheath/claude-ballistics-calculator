import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, Legend, ResponsiveContainer, Label
} from 'recharts';
import type { TrajectoryResponse } from '../types';

interface Props {
  data: TrajectoryResponse;
}

export default function TrajectoryChart({ data }: Props) {
  const isMetric = data.unitSystem === 'meters';
  const rangeLabel = isMetric ? 'Range (m)' : 'Range (yards)';
  const heightLabel = isMetric ? 'Height (cm)' : 'Height (inches)';

  // Downsample to every 5 points for chart performance
  const step = 5;
  const chartData = data.points.filter((_, i) => i % step === 0 || i === data.points.length - 1);

  const crossingRange = data.secondCrossingRange;

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
            formatter={(value, name) => {
              if (value == null) return '';
              const v = Number(value);
              const labels: Record<string, string> = {
                height: `${v.toFixed(2)} ${isMetric ? 'cm' : 'in'}`,
                velocity: `${v.toFixed(0)} ${isMetric ? 'm/s' : 'fps'}`,
                energy: `${v.toFixed(0)} ${isMetric ? 'J' : 'ft-lbs'}`,
              };
              return labels[name ?? ''] ?? v.toFixed(2);
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
