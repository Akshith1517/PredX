/* Luxury KPI metric card with gold accent line */
export default function KpiCard({
  title,
  value,
  unit,
  icon: Icon,
  color = 'var(--gold-bright)',
  delta,
  deltaLabel,
  glow,
  children,
}) {
  return (
    <div
      className="glass-card gold-top-line animate-float-in"
      style={{
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: glow
          ? `var(--shadow-card), 0 0 28px ${color}22`
          : 'var(--shadow-card)',
        transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `var(--shadow-card), 0 0 32px ${color}28`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = glow
          ? `var(--shadow-card), 0 0 28px ${color}22`
          : 'var(--shadow-card)';
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.38)',
        }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            width: 34, height: 34,
            borderRadius: 10,
            background: `${color}18`,
            border: `1px solid ${color}28`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={15} color={color} strokeWidth={2} />
          </div>
        )}
      </div>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        <span className="metric-value" style={{ fontSize: '2rem', color: '#fff' }}>
          {value ?? '—'}
        </span>
        {unit && (
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.38)', marginBottom: 4 }}>
            {unit}
          </span>
        )}
      </div>

      {/* Delta / sub-content */}
      {delta != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: delta >= 0 ? 'var(--status-healthy)' : 'var(--status-failure)',
          }}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%
          </span>
          {deltaLabel && (
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
              {deltaLabel}
            </span>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
