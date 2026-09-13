/* Severity badge used in the alerts table */
const CONFIGS = {
  critical: { bg: 'rgba(249,115,22,0.14)', color: 'var(--status-critical)', border: 'rgba(249,115,22,0.28)', label: 'Critical' },
  warning:  { bg: 'rgba(240,180,41,0.14)', color: 'var(--status-warning)',  border: 'rgba(240,180,41,0.28)', label: 'Warning'  },
  info:     { bg: 'rgba(56,189,248,0.14)', color: 'var(--sensor-current)', border: 'rgba(56,189,248,0.28)', label: 'Info'     },
  resolved: { bg: 'rgba(34,211,165,0.1)',  color: 'var(--status-healthy)',  border: 'rgba(34,211,165,0.2)',  label: 'Resolved' },
};

export default function AlertBadge({ severity }) {
  const cfg = CONFIGS[severity] ?? CONFIGS.info;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 10px',
      borderRadius: 'var(--radius-full)',
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      color: cfg.color,
      fontSize: '0.72rem',
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 5, height: 5,
        borderRadius: '50%',
        background: cfg.color,
        display: 'inline-block',
      }} />
      {cfg.label}
    </span>
  );
}
