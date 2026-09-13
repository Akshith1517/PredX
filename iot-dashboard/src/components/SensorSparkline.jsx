import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

export default function SensorSparkline({ data, dataKey, color, height = 48 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotoneX"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${dataKey})`}
          dot={false}
          isAnimationActive={false}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--glass-border-bright)',
            borderRadius: 8,
            fontSize: 11,
            padding: '4px 10px',
          }}
          itemStyle={{ color: color }}
          labelStyle={{ display: 'none' }}
          formatter={v => [v, '']}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
