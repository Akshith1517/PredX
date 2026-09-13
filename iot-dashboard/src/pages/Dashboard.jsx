import { Thermometer, Zap, Activity, Shield, Clock, AlertTriangle, CheckCircle2, TrendingUp, Gauge } from 'lucide-react';
import PageShell from '../components/PageShell';
import KpiCard from '../components/KpiCard';
import SensorSparkline from '../components/SensorSparkline';
import AlertBadge from '../components/AlertBadge';
import HealthGauge from '../components/HealthGauge';
import { useLiveSensor } from '../hooks/useLiveSensor';
import { ALERTS_INITIAL, MACHINE, DAILY_STATS, healthColour, healthLabel } from '../data/mockData';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function Dashboard() {
  const { latest, history, healthScore, healthStatus, anomaly, connected, dataSource, triggerAnomaly, clearAnomaly } = useLiveSensor(2000);

  const recentAlerts = ALERTS_INITIAL.slice(0, 4);

  const radarData = [
    { subject: 'Temperature', value: Math.min(100, ((latest.temperature ?? 0) / 80) * 100) },
    { subject: 'Vibration', value: Math.min(100, ((latest.vibration_magnitude ?? 0) / 2.5) * 100) },
    { subject: 'Current', value: Math.min(100, ((latest.current ?? 0) / 4) * 100) },
    { subject: 'RPM', value: Math.min(100, ((latest.rpm ?? 0) / 3500) * 100) },
    { subject: 'Health', value: healthScore },
    { subject: 'Uptime', value: 99.2 },
  ];

  const colour = healthColour(healthScore);

  return (
    <PageShell
      title="Operations Dashboard"
      subtitle={`Motor Unit 001 — ${MACHINE.location}`}
      connected={connected}
      anomaly={anomaly}
      dataSource={dataSource}
    >
      {/* ── Demo controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Simulation
        </span>
        <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '5px 14px' }} onClick={triggerAnomaly}>
          Trigger Anomaly
        </button>
        <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '5px 14px' }} onClick={clearAnomaly}>
          Clear
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="live-dot" />
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
            Live · 2 s refresh
          </span>
        </div>
      </div>

      {/* ── Top row: Health Gauge + KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, marginBottom: 24 }}>

        {/* Health Gauge card */}
        <div className="glass-card gold-top-line animate-float-in" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: '100%' }}>
            <div className="section-heading" style={{ justifyContent: 'center', marginBottom: 8 }}>
              <span className="accent-bar" />
              Machine Health
            </div>
          </div>
          <HealthGauge score={healthScore} size={220} />
          <span className={`status-pill ${healthStatus}`} style={{ marginTop: -8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: colour, display: 'inline-block' }} />
            {healthLabel(healthScore)}
          </span>
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
            {[
              { label: 'Uptime', value: DAILY_STATS.uptime },
              { label: 'Alerts Today', value: DAILY_STATS.alerts_today },
              { label: 'Op. Hours', value: `${MACHINE.operatingHours} h` },
              { label: 'Anomalies', value: DAILY_STATS.anomalies_today },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--glass-1)', borderRadius: 'var(--radius-md)', padding: '10px 14px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* KPI grid with RPM included */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <KpiCard title="Temperature" value={latest.temperature?.toFixed(1)} unit="°C" icon={Thermometer} color="var(--sensor-temp)" delta={2.1} deltaLabel="vs avg">
            <SensorSparkline data={history.slice(-30)} dataKey="temperature" color="var(--sensor-temp)" />
          </KpiCard>
          <KpiCard title="Motor Current" value={latest.current?.toFixed(2)} unit="A" icon={Zap} color="var(--sensor-current)" delta={-0.4} deltaLabel="vs avg">
            <SensorSparkline data={history.slice(-30)} dataKey="current" color="var(--sensor-current)" />
          </KpiCard>
          <KpiCard title="Rotor Speed" value={latest.rpm != null ? Math.round(latest.rpm).toString() : '0'} unit="RPM" icon={Gauge} color="#38bdf8" delta={0.0} deltaLabel="dual magnet">
            <SensorSparkline data={history.slice(-30)} dataKey="rpm" color="#38bdf8" />
          </KpiCard>
          <KpiCard title="Vibration Magnitude" value={latest.vibration_magnitude?.toFixed(3)} unit="g" icon={Activity} color="var(--sensor-vib)" glow={anomaly}>
            <SensorSparkline data={history.slice(-30)} dataKey="vibration_magnitude" color="var(--sensor-vib)" />
          </KpiCard>
          <KpiCard title="Predictive Score" value={healthScore?.toFixed(1)} unit="/ 100" icon={Shield} color={colour} glow>
            <SensorSparkline data={history.slice(-30)} dataKey="health_score" color={colour} />
          </KpiCard>
        </div>
      </div>

      {/* ── Middle row: Radar + Machine Info + Vibration ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Radar chart */}
        <div className="glass-card animate-float-in" style={{ padding: '24px' }}>
          <div className="section-heading" style={{ marginBottom: 18 }}>
            <span className="accent-bar" />
            System Radar
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.38)', fontSize: 11, fontFamily: 'var(--font-body)' }} />
              <Radar dataKey="value" stroke="var(--gold-bright)" fill="var(--gold-bright)" fillOpacity={0.12} strokeWidth={1.5} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border-bright)', borderRadius: 10, fontSize: 12 }}
                formatter={v => [`${Number(v).toFixed(1)}%`]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Machine info */}
        <div className="glass-card animate-float-in" style={{ padding: '24px' }}>
          <div className="section-heading" style={{ marginBottom: 18 }}>
            <span className="accent-bar" />
            Machine Details
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Machine ID', value: MACHINE.id },
              { label: 'Motor Type', value: MACHINE.motor_type },
              { label: 'Location', value: MACHINE.location },
              { label: 'Firmware', value: MACHINE.firmware },
              { label: 'Last Maintenance', value: MACHINE.lastMaintenance },
              { label: 'Next Maintenance', value: MACHINE.nextMaintenance },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'rgba(255,255,255,0.82)', fontFamily: label === 'Machine ID' || label === 'Firmware' ? 'var(--font-mono)' : 'inherit' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live axis values */}
        <div className="glass-card animate-float-in" style={{ padding: '24px' }}>
          <div className="section-heading" style={{ marginBottom: 18 }}>
            <span className="accent-bar" />
            Vibration Axes
          </div>
          {[
            { axis: 'X', value: latest.vibration_x, color: '#f87171' },
            { axis: 'Y', value: latest.vibration_y, color: '#fb923c' },
            { axis: 'Z', value: latest.vibration_z, color: 'var(--sensor-vib)' },
          ].map(({ axis, value, color }) => (
            <div key={axis} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>Axis {axis}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color, fontWeight: 600 }}>{value?.toFixed(3)} g</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (Math.abs(value ?? 0) / 2.5) * 100)}%`,
                  background: `linear-gradient(90deg, ${color}88, ${color})`,
                  borderRadius: 4,
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          ))}
          <div className="gold-divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)' }}>Magnitude</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--sensor-vib)' }}>
              {latest.vibration_magnitude?.toFixed(3)} g
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
            {anomaly
              ? <><AlertTriangle size={12} color="var(--status-critical)" /><span style={{ fontSize: '0.72rem', color: 'var(--status-critical)' }}>Elevated vibration detected</span></>
              : <><CheckCircle2 size={12} color="var(--status-healthy)" /><span style={{ fontSize: '0.72rem', color: 'var(--status-healthy)' }}>Within normal range</span></>
            }
          </div>
        </div>
      </div>

      {/* ── Recent Alerts ── */}
      <div className="glass-card animate-float-in" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div className="section-heading">
            <span className="accent-bar" />
            Recent Alerts
          </div>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
            Motor Unit 001 · Last 24 h
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Type</th>
              <th>Message</th>
              <th>Suspected Cause</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentAlerts.map(alert => (
              <tr key={alert.id}>
                <td><AlertBadge severity={alert.severity} /></td>
                <td style={{ fontWeight: 500, color: 'rgba(255,255,255,0.88)' }}>{alert.type}</td>
                <td style={{ color: 'rgba(255,255,255,0.62)', maxWidth: 280 }}>{alert.message}</td>
                <td style={{ color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', fontSize: '0.8rem' }}>{alert.suspected_cause}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)', whiteSpace: 'nowrap' }}>
                  {new Date(alert.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    background: alert.status === 'resolved' ? 'rgba(34,211,165,0.1)' : alert.status === 'acknowledged' ? 'rgba(240,180,41,0.1)' : 'rgba(249,115,22,0.1)',
                    color: alert.status === 'resolved' ? 'var(--status-healthy)' : alert.status === 'acknowledged' ? 'var(--status-warning)' : 'var(--status-critical)',
                  }}>
                    {alert.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}s