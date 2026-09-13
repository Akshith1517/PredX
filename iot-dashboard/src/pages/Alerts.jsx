import { useState } from 'react';
import { BellRing, CheckCheck, Filter, Search, AlertTriangle, Info, ShieldAlert, Clock } from 'lucide-react';
import PageShell from '../components/PageShell';
import AlertBadge from '../components/AlertBadge';
import { ALERTS_INITIAL } from '../data/mockData';

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };

export default function Alerts() {
  const [alerts, setAlerts] = useState(ALERTS_INITIAL);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = alerts
    .filter(a => filter === 'all' || a.severity === filter || (filter === 'open' && a.status === 'open'))
    .filter(a =>
      search === '' ||
      a.type.toLowerCase().includes(search.toLowerCase()) ||
      a.message.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (a.status === 'open' && b.status !== 'open') return -1;
      if (b.status === 'open' && a.status !== 'open') return 1;
      return (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
    });

  const acknowledge = id =>
    setAlerts(prev => prev.map(a => a.id === id && a.status === 'open' ? { ...a, status: 'acknowledged' } : a));

  const resolve = id =>
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a));

  const counts = {
    total: alerts.length,
    open: alerts.filter(a => a.status === 'open').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
  };

  const SeverityIcon = ({ sev }) => {
    if (sev === 'critical') return <ShieldAlert size={14} color="var(--status-critical)" />;
    if (sev === 'warning')  return <AlertTriangle size={14} color="var(--status-warning)" />;
    return <Info size={14} color="var(--sensor-current)" />;
  };

  return (
    <PageShell title="Alerts & Fault Detection" subtitle="Motor Unit 001 — event log">

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Alerts', value: counts.total, color: 'rgba(255,255,255,0.55)', icon: BellRing },
          { label: 'Open',         value: counts.open,     color: 'var(--status-critical)', icon: AlertTriangle },
          { label: 'Critical',     value: counts.critical, color: 'var(--status-critical)', icon: ShieldAlert },
          { label: 'Warnings',     value: counts.warning,  color: 'var(--status-warning)',  icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass-card gold-top-line animate-float-in" style={{ padding: '18px 22px', display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={17} color={color} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.6rem', color: '#fff', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.38)' }}>
          <Filter size={14} />
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filter</span>
        </div>
        {['all', 'open', 'critical', 'warning', 'info'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '5px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid',
              borderColor: filter === f ? 'var(--gold-mid)' : 'var(--glass-border)',
              background: filter === f ? 'rgba(201,146,42,0.12)' : 'var(--glass-1)',
              color: filter === f ? 'var(--gold-bright)' : 'rgba(255,255,255,0.45)',
              fontSize: '0.78rem',
              fontWeight: filter === f ? 700 : 400,
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all var(--transition-fast)',
            }}
          >
            {f}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '6px 14px' }}>
          <Search size={13} color="rgba(255,255,255,0.3)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search alerts..."
            style={{ background: 'none', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', width: 180, fontFamily: 'var(--font-body)' }}
          />
        </div>
      </div>

      {/* Alerts list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
            <CheckCheck size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            No alerts match the current filter.
          </div>
        )}
        {filtered.map(alert => (
          <div
            key={alert.id}
            className="glass-card animate-float-in"
            style={{
              padding: '18px 22px',
              border: alert.status === 'open' && alert.severity === 'critical'
                ? '1px solid rgba(249,115,22,0.3)'
                : '1px solid var(--glass-border)',
              display: 'grid',
              gridTemplateColumns: '90px 1fr auto',
              gap: 20,
              alignItems: 'start',
              transition: 'opacity 0.3s',
              opacity: alert.status === 'resolved' ? 0.6 : 1,
            }}
          >
            {/* Severity */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <AlertBadge severity={alert.severity} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={10} color="rgba(255,255,255,0.25)" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.28)' }}>
                  {new Date(alert.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Content */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <SeverityIcon sev={alert.severity} />
                <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'rgba(255,255,255,0.9)' }}>{alert.type}</span>
                <span style={{
                  padding: '1px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: alert.status === 'resolved' ? 'rgba(34,211,165,0.1)' : alert.status === 'acknowledged' ? 'rgba(240,180,41,0.1)' : 'rgba(249,115,22,0.1)',
                  color: alert.status === 'resolved' ? 'var(--status-healthy)' : alert.status === 'acknowledged' ? 'var(--status-warning)' : 'var(--status-critical)',
                  marginLeft: 4,
                }}>
                  {alert.status}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.62)', marginBottom: 6, lineHeight: 1.5 }}>{alert.message}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Suspected cause:</span>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.48)', fontStyle: 'italic' }}>{alert.suspected_cause}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Machine:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.48)' }}>{alert.machine_id}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              {alert.status === 'open' && (
                <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '5px 14px' }} onClick={() => acknowledge(alert.id)}>
                  Acknowledge
                </button>
              )}
              {alert.status !== 'resolved' && (
                <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '5px 14px', color: 'var(--status-healthy)', borderColor: 'rgba(34,211,165,0.2)' }} onClick={() => resolve(alert.id)}>
                  Resolve
                </button>
              )}
              {alert.status === 'resolved' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--status-healthy)' }}>
                  <CheckCheck size={13} /> Resolved
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Fault legend */}
      <div className="glass-card animate-float-in" style={{ padding: '22px 24px', marginTop: 24 }}>
        <div className="section-heading" style={{ marginBottom: 16 }}>
          <span className="accent-bar" />
          Fault Classification Reference
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { type: 'Bearing Wear',    symptoms: 'Elevated Z-axis vibration, high variance', color: 'var(--status-warning)' },
            { type: 'Shaft Imbalance', symptoms: 'X/Y vibration spike at rotation frequency', color: 'var(--status-critical)' },
            { type: 'Overheating',     symptoms: 'Sustained temperature rise > 10 °C / 30 min', color: 'var(--sensor-temp)' },
            { type: 'Overload',        symptoms: 'Current consistently above nominal rating', color: 'var(--sensor-current)' },
            { type: 'Sensor Fault',    symptoms: 'Dropout, stuck value or extreme reading', color: 'var(--status-offline)' },
            { type: 'MQTT Disconnect', symptoms: 'Telemetry gap > 30 s from last reading', color: 'rgba(255,255,255,0.3)' },
          ].map(({ type, symptoms, color }) => (
            <div key={type} style={{ padding: '12px 14px', background: 'var(--glass-1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.82)' }}>{type}</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 }}>{symptoms}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
