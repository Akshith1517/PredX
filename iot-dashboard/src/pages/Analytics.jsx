import { useState, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, Bar,
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import PageShell from '../components/PageShell';
import { buildHistory } from '../data/mockData';

const RANGES = [
  { label: '1 h',  points: 60,  anomalyAt: null },
  { label: '2 h',  points: 120, anomalyAt: 90  },
  { label: '6 h',  points: 180, anomalyAt: 150 },
  { label: '12 h', points: 240, anomalyAt: 210 },
];

function StatChip({ label, value, unit, trend }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'var(--status-critical)' : trend === 'down' ? 'var(--status-healthy)' : 'rgba(255,255,255,0.35)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 18px', background: 'var(--glass-1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>{value}</span>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{unit}</span>
        <TrendIcon size={13} color={trendColor} style={{ marginBottom: 3 }} />
      </div>
    </div>
  );
}

export default function Analytics() {
  const [rangeIdx, setRangeIdx] = useState(1);
  const { points, anomalyAt } = RANGES[rangeIdx];

  const data = useMemo(() => buildHistory(points, anomalyAt), [points, anomalyAt]);

  // Compute stats from data
  const stats = useMemo(() => {
    const temps = data.map(d => d.temperature);
    const currents = data.map(d => d.current);
    const vibs = data.map(d => d.vibration_magnitude);
    const avg = arr => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
    const max = arr => Math.max(...arr).toFixed(2);
    const min = arr => Math.min(...arr).toFixed(2);
    return { temps: { avg: avg(temps), max: max(temps), min: min(temps) }, currents: { avg: avg(currents), max: max(currents) }, vibs: { avg: avg(vibs), max: max(vibs) } };
  }, [data]);

  // Thin data for chart performance
  const chartData = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 80)) === 0);

  return (
    <PageShell title="Analytics" subtitle="Historical sensor data & trend analysis">

      {/* Range selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Calendar size={16} color="rgba(255,255,255,0.38)" />
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Time Range</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRangeIdx(i)}
              style={{
                padding: '5px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid',
                borderColor: rangeIdx === i ? 'var(--gold-mid)' : 'var(--glass-border)',
                background: rangeIdx === i ? 'linear-gradient(135deg, rgba(201,146,42,0.18), rgba(201,146,42,0.06))' : 'var(--glass-1)',
                color: rangeIdx === i ? 'var(--gold-bright)' : 'rgba(255,255,255,0.45)',
                fontSize: '0.78rem',
                fontWeight: rangeIdx === i ? 700 : 400,
                cursor: 'pointer',
                transition: 'all var(--transition-normal)',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-mono)' }}>
          {points} data points
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatChip label="Avg Temp"  value={stats.temps.avg}     unit="°C" trend="up"   />
        <StatChip label="Max Temp"  value={stats.temps.max}     unit="°C" trend="up"   />
        <StatChip label="Avg Current" value={stats.currents.avg} unit="A" trend="down" />
        <StatChip label="Max Current" value={stats.currents.max} unit="A" trend="up"   />
        <StatChip label="Avg Vib"   value={stats.vibs.avg}      unit="g"  trend="none" />
        <StatChip label="Max Vib"   value={stats.vibs.max}      unit="g"  trend="up"   />
      </div>

      {/* Temperature chart */}
      <div className="glass-card animate-float-in" style={{ padding: '24px', marginBottom: 20 }}>
        <div className="section-heading" style={{ marginBottom: 18 }}>
          <span className="accent-bar" />
          Temperature History
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -15 }}>
            <defs>
              <linearGradient id="tempAGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--sensor-temp)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--sensor-temp)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
            <Area type="monotoneX" dataKey="temperature" stroke="var(--sensor-temp)" strokeWidth={2} fill="url(#tempAGrad)" dot={false} isAnimationActive={false} />
            <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border-bright)', borderRadius: 10, fontSize: 12 }}
              itemStyle={{ color: 'var(--sensor-temp)' }} formatter={v => [`${Number(v).toFixed(2)} °C`, 'Temperature']} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Current chart */}
      <div className="glass-card animate-float-in" style={{ padding: '24px', marginBottom: 20 }}>
        <div className="section-heading" style={{ marginBottom: 18 }}>
          <span className="accent-bar" />
          Motor Current History
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -15 }}>
            <defs>
              <linearGradient id="currentAGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--sensor-current)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--sensor-current)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
            <Bar dataKey="current" fill="var(--sensor-current)" opacity={0.12} barSize={4} radius={[2,2,0,0]} isAnimationActive={false} />
            <Area type="monotoneX" dataKey="current" stroke="var(--sensor-current)" strokeWidth={2} fill="url(#currentAGrad)" dot={false} isAnimationActive={false} />
            <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border-bright)', borderRadius: 10, fontSize: 12 }}
              itemStyle={{ color: 'var(--sensor-current)' }} formatter={v => [`${Number(v).toFixed(3)} A`, 'Current']} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Vibration axes + health score side by side */}
      <div className="grid-2">
        <div className="glass-card animate-float-in" style={{ padding: '24px' }}>
          <div className="section-heading" style={{ marginBottom: 18 }}>
            <span className="accent-bar" />
            Vibration — All Axes
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -15 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
              <Line type="monotoneX" dataKey="vibration_x" stroke="#f87171" strokeWidth={1.5} dot={false} name="X" isAnimationActive={false} />
              <Line type="monotoneX" dataKey="vibration_y" stroke="#fb923c" strokeWidth={1.5} dot={false} name="Y" isAnimationActive={false} />
              <Line type="monotoneX" dataKey="vibration_z" stroke="var(--sensor-vib)" strokeWidth={1.5} dot={false} name="Z" isAnimationActive={false} />
              <Line type="monotoneX" dataKey="vibration_magnitude" stroke="rgba(255,255,255,0.5)" strokeWidth={1} dot={false} name="Magnitude" strokeDasharray="4 2" isAnimationActive={false} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', paddingTop: 8 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border-bright)', borderRadius: 10, fontSize: 12 }}
                formatter={v => [`${Number(v).toFixed(4)} g`]} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card animate-float-in" style={{ padding: '24px' }}>
          <div className="section-heading" style={{ marginBottom: 18 }}>
            <span className="accent-bar" />
            Health Score Trend
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -15 }}>
              <defs>
                <linearGradient id="healthAGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gold-bright)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--gold-bright)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
              <Area type="monotoneX" dataKey="health_score" stroke="var(--gold-bright)" strokeWidth={2} fill="url(#healthAGrad2)" dot={false} isAnimationActive={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border-bright)', borderRadius: 10, fontSize: 12 }}
                itemStyle={{ color: 'var(--gold-bright)' }} formatter={v => [`${Number(v).toFixed(1)}`, 'Health Score']} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageShell>
  );
}
