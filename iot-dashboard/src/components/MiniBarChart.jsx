import { BarChart, Bar, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function MiniBarChart({ data, dataKey, color, height = 48 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barSize={4} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <Bar dataKey={dataKey} radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={color}
              opacity={0.35 + (i / data.length) * 0.65}
            />
          ))}
        </Bar>
        <Tooltip
          contentStyle={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--glass-border-bright)',
            borderRadius: 8,
            fontSize: 11,
            padding: '4px 10px',
          }}
          itemStyle={{ color }}
          labelStyle={{ display: 'none' }}
          formatter={v => [v, '']}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
