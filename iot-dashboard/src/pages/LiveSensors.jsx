import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Thermometer, Zap, Activity, Waves, Gauge } from 'lucide-react';
import PageShell from '../components/PageShell';
import { useLiveSensor } from '../hooks/useLiveSensor';

const THRESHOLDS = {
  temperature: 55,
  current: 3.0,
  vibration_magnitude: 2.0,
  rpm: 3500,
};

function LiveChart({ data, dataKey, color, label, unit, threshold, height = 180 }) {
  return (
    <div className="glass-card animate-float-in" style={{ padding: '20px 24px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.38)' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 700, color }}>
          {data.length ? Number(data[data.length - 1][dataKey] ?? 0).toFixed(unit === 'RPM' ? 0 : 3) : '—'} {unit}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontFamily: 'var(--font-mono)' }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} width={40} />
          {threshold != null && (
            <ReferenceLine y={threshold} stroke="rgba(249,115,22,0.5)" strokeDasharray="4 4"
              label={{ value: 'Threshold', fill: 'rgba(249,115,22,0.6)', fontSize: 9, position: 'insideTopRight' }}
            />
          )}
          <Area type="monotoneX" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#grad-${dataKey})`} dot={false} isAnimationActive={false} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border-bright)', borderRadius: 10, fontSize: 12 }}
            itemStyle={{ color }}
            labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            formatter={v => [`${Number(v).toFixed(unit === 'RPM' ? 0 : 3)} ${unit}`, label]}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function AxisChart({ data }) {
  return (
    <div className="glass-card animate-float-in" style={{ padding: '20px 24px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.38)' }}>
          Vibration — X / Y / Z Axes
        </span>
        <div style={{ display: 'flex', gap: 14 }}>
          {[['X', '#f87171'], ['Y', '#fb923c'], ['Z', 'var(--sensor-vib)']].map(([ax, col]) => (
            <span key={ax} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: col }}>
              <span style={{ width: 18, height: 2, background: col, borderRadius: 1, display: 'inline-block' }} />
              Axis {ax}
            </span>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
          <Line type="monotoneX" dataKey="vibration_x" stroke="#f87171" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Line type="monotoneX" dataKey="vibration_y" stroke="#fb923c" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Line type="monotoneX" dataKey="vibration_z" stroke="var(--sensor-vib)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border-bright)', borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            formatter={(v, k) => [`${Number(v).toFixed(4)} g`, k]}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function LiveSensors() {
  const { latest, history, anomaly, connected, dataSource, triggerAnomaly, clearAnomaly } = useLiveSensor(2000);

  const liveCards = [
    { title: 'Temperature', value: latest.temperature?.toFixed(1), unit: '°C', icon: Thermometer, color: 'var(--sensor-temp)', detail: 'Motor housing surface', threshold: 55 },
    { title: 'Motor Current', value: latest.current?.toFixed(2), unit: 'A', icon: Zap, color: 'var(--sensor-current)', detail: 'INA219 High-Side', threshold: 3.0 },
    { title: 'Rotor Speed', value: latest.rpm != null ? Math.round(latest.rpm).toString() : '0', unit: 'RPM', icon: Gauge, color: '#38bdf8', detail: 'A3144 Hall Effect', threshold: 3500 },
    { title: 'Vib. Magnitude', value: latest.vibration_magnitude?.toFixed(3), unit: 'g', icon: Activity, color: 'var(--sensor-vib)', detail: 'MPU6050 Resultant', threshold: 2.0 },
    { title: 'Vib. Z-Axis', value: latest.vibration_z?.toFixed(4), unit: 'g', icon: Waves, color: '#a78bfa', detail: 'Primary axis', threshold: 1.8 },
  ];

  return (
    <PageShell title="Live Sensor Monitoring" subtitle="Real-time ESP32 telemetry — 2 s interval" connected={connected} anomaly={anomaly} dataSource={dataSource}>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Simulation</span>
        <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '5px 14px' }} onClick={triggerAnomaly}>Trigger Anomaly</button>
        <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '5px 14px' }} onClick={clearAnomaly}>Clear</button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="live-dot" />
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>Live · 2 s refresh</span>
        </div>
      </div>

      {/* Live value chips - 5-column responsive grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {liveCards.map(({ title, value, unit, icon: Icon, color, detail, threshold }) => {
          const num = parseFloat(value);
          const over = !isNaN(num) && num > threshold;
          return (
            <div key={title} className="glass-card gold-top-line animate-float-in" style={{
              padding: '20px 22px',
              border: over ? `1px solid rgba(249,115,22,0.3)` : '1px solid var(--glass-border)',
              boxShadow: over ? 'var(--shadow-card), 0 0 24px rgba(249,115,22,0.15)' : 'var(--shadow-card)',
              transition: 'all 0.3s ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.38)' }}>{title}</span>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={13} color={color} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.65rem', color: over ? 'var(--status-critical)' : '#fff', lineHeight: 1, transition: 'color 0.3s' }}>
                  {value ?? '—'}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>{unit}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)' }}>{detail}</span>
                {over && <span style={{ fontSize: '0.65rem', color: 'var(--status-critical)', fontWeight: 700, textTransform: 'uppercase' }}>⚠ Over threshold</span>}
              </div>
              {/* Threshold progress bar */}
              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginTop: 10, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (!isNaN(num) ? (num / (threshold * 1.2)) * 100 : 0))}%`,
                  background: over ? 'linear-gradient(90deg, var(--status-warning), var(--status-critical))' : `linear-gradient(90deg, ${color}88, ${color})`,
                  borderRadius: 3,
                  transition: 'width 0.5s ease, background 0.4s',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row 1: Temp, Current, and RPM */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
        <LiveChart data={history} dataKey="temperature" color="var(--sensor-temp)" label="Temperature" unit="°C" threshold={THRESHOLDS.temperature} />
        <LiveChart data={history} dataKey="current" color="var(--sensor-current)" label="Motor Current" unit="A" threshold={THRESHOLDS.current} />
        <LiveChart data={history} dataKey="rpm" color="#38bdf8" label="Rotor Speed" unit="RPM" threshold={THRESHOLDS.rpm} />
      </div>

      {/* Charts row 2: Vibration Magnitude and Axes */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <LiveChart data={history} dataKey="vibration_magnitude" color="var(--sensor-vib)" label="Vibration Magnitude" unit="g" threshold={THRESHOLDS.vibration_magnitude} />
        <AxisChart data={history} />
      </div>

      {/* Raw telemetry card */}
      <div className="glass-card animate-float-in" style={{ padding: '20px 24px' }}>
        <div className="section-heading" style={{ marginBottom: 14 }}>
          <span className="accent-bar" />
          Raw MQTT Payload
        </div>
        <pre style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          color: 'rgba(255,255,255,0.62)',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          overflowX: 'auto',
          lineHeight: 1.8,
        }}>
          {JSON.stringify({
            machine_id: latest.machine_id,
            timestamp: latest.timestamp,
            rpm: latest.rpm,
            temperature: latest.temperature,
            current: latest.current,
            vibration_magnitude: latest.vibration_magnitude,
            vibration_x: latest.vibration_x,
            vibration_y: latest.vibration_y,
            vibration_z: latest.vibration_z,
          }, null, 2)}
        </pre>
      </div>
    </PageShell>
  );
}