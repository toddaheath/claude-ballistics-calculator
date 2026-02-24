import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceDot, Legend, ResponsiveContainer, Label
} from 'recharts';
import type { TrajectoryResponse } from '../types';

const RANGE_PRESETS = [150, 300, 500, 750, 1000]; // yards

interface Props {
  data: TrajectoryResponse;
  maxRange: number;
  onMaxRangeChange: (range: number) => void;
}

export default function TrajectoryChart({ data, maxRange, onMaxRangeChange }: Props) {
  const isMetric = data.unitSystem === 'meters';
  const rangeLabel = isMetric ? 'Range (m)' : 'Range (yards)';
  const heightLabel = isMetric ? 'Height (cm)' : 'Height (inches)';
  const unit = isMetric ? 'm' : 'yd';

  // Downsample to every 5 points for chart performance
  const chartData = data.points.filter((_, i) => i % 5 === 0 || i === data.points.length - 1);

  const crossingRange = data.secondCrossingRange;

  return (
    <div className="trajectory-chart">
      <div className="chart-header">
        <h3>Trajectory: {data.cartridgeName}</h3>
        <div className="range-presets">
          <span className="range-presets-label">Max range:</span>
          {RANGE_PRESETS.map((r) => (
            <button
              key={r}
              className={`range-btn${maxRange === r ? ' active' : ''}`}
              onClick={() => onMaxRangeChange(r)}
            >
              {r}yd
            </button>
          ))}
        </div>
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
            formatter={(value, name) => {
              if (value == null) return '';
              const v = Number(value);
              const labels: Record<string, string> = {
                height: `${v.toFixed(2)} ${isMetric ? 'cm' : 'in'}`,
                velocity: `${v.toFixed(0)} ${isMetric ? 'm/s' : 'fps'}`,
                energy: `${v.toFixed(0)} ${isMetric ? 'J' : 'ft-lbs'}`,
              };
              return labels[String(name)] ?? v.toFixed(2);
            }}
            labelFormatter={(label) => `Range: ${Number(label).toFixed(0)} ${unit}`}
          />
          <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 13 }} />

          {/* Line of sight */}
          <ReferenceLine
            y={0}
            stroke="#999"
            strokeDasharray="6 4"
            label={{ value: 'Line of sight', position: 'insideBottomRight', fill: '#999', fontSize: 11, dy: -4 }}
          />

          {/* Height-at-50 reference */}
          {data.heightAt50 !== 0 && (
            <ReferenceLine
              y={data.heightAt50}
              stroke="#e67e22"
              strokeDasharray="4 3"
              label={{
                value: `${data.heightAt50 > 0 ? '+' : ''}${data.heightAt50.toFixed(1)}${isMetric ? 'cm' : '"'} @ 50${unit}`,
                position: 'insideTopRight',
                fill: '#e67e22',
                fontSize: 11,
                dy: -4,
              }}
            />
          )}

          {/* Trajectory line */}
          <Line
            type="monotone"
            dataKey="height"
            stroke="#2980b9"
            strokeWidth={2.5}
            dot={false}
            name="height"
          />

          {/* Zero crossing dot */}
          <ReferenceDot
            x={data.zeroRange}
            y={0}
            r={6}
            fill="#2980b9"
            stroke="#fff"
            strokeWidth={2}
            label={{
              value: `Zero ${data.zeroRange.toFixed(0)}${unit}`,
              position: 'top',
              fill: '#2980b9',
              fontSize: 11,
              fontWeight: 600,
            }}
          />

          {/* Second crossing dot — where trajectory returns to height-at-50 level */}
          {crossingRange > 0 && (
            <ReferenceDot
              x={crossingRange}
              y={data.heightAt50}
              r={6}
              fill="#e74c3c"
              stroke="#fff"
              strokeWidth={2}
              label={{
                value: `${crossingRange.toFixed(0)}${unit}`,
                position: 'top',
                fill: '#e74c3c',
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          )}

          {/* First crossing dot at 50 yd */}
          {data.heightAt50 !== 0 && (
            <ReferenceDot
              x={isMetric ? 45.7 : 50}
              y={data.heightAt50}
              r={5}
              fill="#e67e22"
              stroke="#fff"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
