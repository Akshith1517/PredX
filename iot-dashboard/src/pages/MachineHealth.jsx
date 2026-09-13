import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { ShieldCheck, ShieldAlert, BrainCircuit, TrendingDown, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import PageShell from '../components/PageShell';
import HealthGauge from '../components/HealthGauge';
import { useLiveSensor } from '../hooks/useLiveSensor';
import { FEATURE_IMPORTANCE, healthColour, healthLabel, healthBand } from '../data/mockData';

const HEALTH_BANDS = [
  { range: '80 – 100', label: 'Healthy',      color: 'var(--status-healthy)',  desc: 'Normal operation. No action required.' },
  { range: '60 – 79',  label: 'Warning',       color: 'var(--status-warning)',  desc: 'Elevated readings. Schedule inspection.' },
  { range: '40 – 59',  label: 'Critical',      color: 'var(--status-critical)', desc: 'Significant anomaly. Maintenance soon.' },
  { range: '< 40',     label: 'Failure Risk',  color: 'var(--status-failure)',  desc: 'Immediate action recommended.' },
];

export default function MachineHealth() {
  const { latest, history, healthScore, healthStatus, anomaly, connected, dataSource, triggerAnomaly, clearAnomaly } = useLiveSensor(2000);

  const colour = healthColour(healthScore);
  const label  = healthLabel(healthScore);
  const band   = healthBand(healthScore);

  const anomalyScore = anomaly ? 0.73 : 0.11;

  // Last 60 health score readings
  const healthHistory = history.slice(-60);

  return (
    <PageShell title="Machine Health" subtitle="ML-assisted health scoring & anomaly state" connected={connected} anomaly={anomaly} dataSource={dataSource}>

      {/* Demo controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Simulation</span>
        <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '5px 14px' }} onClick={triggerAnomaly}>Trigger Anomaly</button>
        <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '5px 14px' }} onClick={clearAnomaly}>Clear</button>
      </div>

      {/* Top row */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, marginBottom: 24 }}>

        {/* Big gauge */}
        <div className="glass-card gold-top-line animate-float-in" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div className="section-heading" style={{ width: '100%', justifyContent: 'center' }}>
            <span className="accent-bar" />
            Health Score
          </div>
          <HealthGauge score={healthScore} size={240} />
          <span className={`status-pill ${band}`} style={{ fontSize: '0.82rem' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: colour, display: 'inline-block' }} />
            {label}
          </span>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)', textAlign: 'center', lineHeight: 1.6, marginTop: -8, maxWidth: 220 }}>
            {HEALTH_BANDS.find(b => b.label === label)?.desc}
          </p>
        </div>

        {/* Right column — anomaly + predicted issue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Anomaly state card */}
          <div className="glass-card animate-float-in" style={{
            padding: '22px 24px',
            border: anomaly ? '1px solid rgba(249,115,22,0.3)' : '1px solid var(--glass-border)',
            boxShadow: anomaly ? 'var(--shadow-card), 0 0 32px rgba(249,115,22,0.12)' : 'var(--shadow-card)',
            transition: 'all 0.4s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              {anomaly
                ? <ShieldAlert size={22} color="var(--status-critical)" />
                : <ShieldCheck size={22} color="var(--status-healthy)" />
              }
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: anomaly ? 'var(--status-critical)' : 'var(--status-healthy)' }}>
                  {anomaly ? 'Anomaly Detected' : 'Normal Operation'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                  Isolation Forest model · v1.2.0
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Anomaly Score</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.5rem', color: anomaly ? 'var(--status-critical)' : 'var(--status-healthy)' }}>
                  {anomalyScore.toFixed(2)}
                </div>
              </div>
            </div>
            {/* Score bar */}
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${anomalyScore * 100}%`,
                background: anomaly
                  ? 'linear-gradient(90deg, var(--status-warning), var(--status-critical))'
                  : 'linear-gradient(90deg, var(--status-healthy), #34d399)',
                borderRadius: 4,
                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)' }}>Normal</span>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)' }}>Anomalous</span>
            </div>
          </div>

          {/* Predicted issue */}
          <div className="glass-card animate-float-in" style={{ padding: '22px 24px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <BrainCircuit size={18} color="var(--gold-bright)" />
              <span className="section-heading">Predicted Issue</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { issue: 'Bearing Wear',    prob: anomaly ? 0.48 : 0.05, icon: AlertTriangle,  color: 'var(--status-warning)' },
                { issue: 'Shaft Imbalance', prob: anomaly ? 0.31 : 0.04, icon: TrendingDown,   color: 'var(--status-critical)' },
                { issue: 'Overheating',     prob: anomaly ? 0.13 : 0.03, icon: AlertTriangle,  color: 'var(--sensor-temp)' },
                { issue: 'Normal',          prob: anomaly ? 0.08 : 0.88, icon: CheckCircle2,   color: 'var(--status-healthy)' },
              ].map(({ issue, prob, icon: Icon, color }) => (
                <div key={issue}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon size={13} color={color} />
                      <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)' }}>{issue}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color }}>
                      {(prob * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${prob * 100}%`,
                      background: color,
                      borderRadius: 4,
                      opacity: 0.7,
                      transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Health score history chart */}
      <div className="glass-card animate-float-in" style={{ padding: '24px', marginBottom: 24 }}>
        <div className="section-heading" style={{ marginBottom: 18 }}>
          <span className="accent-bar" />
          Health Score — Last 60 Readings
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={healthHistory} margin={{ top: 4, right: 4, bottom: 0, left: -15 }}>
            <defs>
              <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colour} stopOpacity={0.3} />
                <stop offset="100%" stopColor={colour} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
            <Area type="monotoneX" dataKey="health_score" stroke={colour} strokeWidth={2} fill="url(#healthGrad)" dot={false} isAnimationActive={false} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border-bright)', borderRadius: 10, fontSize: 12 }}
              itemStyle={{ color: colour }}
              formatter={v => [`${Number(v).toFixed(1)}`, 'Health Score']}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row: Feature importance + Health bands */}
      <div className="grid-2">

        {/* Feature importance */}
        <div className="glass-card animate-float-in" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <BrainCircuit size={16} color="var(--gold-bright)" />
            <div className="section-heading">Feature Importance</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={FEATURE_IMPORTANCE} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 80 }}>
              <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
              <YAxis type="category" dataKey="feature" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]} barSize={12} isAnimationActive={false}>
                {FEATURE_IMPORTANCE.map((_, i) => (
                  <Cell key={i} fill="var(--gold-bright)" opacity={0.4 + (i === 0 ? 0.6 : (FEATURE_IMPORTANCE.length - i) / FEATURE_IMPORTANCE.length * 0.5)} />
                ))}
              </Bar>
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border-bright)', borderRadius: 10, fontSize: 12 }}
                formatter={v => [`${(v * 100).toFixed(1)}%`, 'Importance']}
              />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)', marginTop: 12, lineHeight: 1.6 }}>
            Based on Isolation Forest + Random Forest feature extraction. Values are indicative — retrain with labelled data for production use.
          </p>
        </div>

        {/* Health bands reference */}
        <div className="glass-card animate-float-in" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Info size={16} color="var(--gold-bright)" />
            <div className="section-heading">Health Band Reference</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {HEALTH_BANDS.map(({ range, label: lbl, color, desc }) => (
              <div key={lbl} style={{
                display: 'flex',
                gap: 14,
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: lbl === label ? `${color}10` : 'var(--glass-1)',
                border: `1px solid ${lbl === label ? color + '30' : 'var(--glass-border)'}`,
                transition: 'all 0.3s',
              }}>
                <div style={{ width: 4, borderRadius: 4, background: color, flexShrink: 0, alignSelf: 'stretch', minHeight: 40 }} />
                <div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color, fontWeight: 700 }}>{range}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'rgba(255,255,255,0.82)' }}>{lbl}</span>
                    {lbl === label && <span style={{ fontSize: '0.65rem', background: `${color}20`, color, padding: '1px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current</span>}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.42)', lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.22)', marginTop: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
            Thresholds are prototype placeholders. Validate against actual motor specifications and operating data before production use.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
