/* ================================================================
   Mock data & real-time simulation engine
   ================================================================ */

// ── Machine registry ──────────────────────────────────────────────
export const MACHINES = [
  {
    id: 'motor_001',
    name: 'Motor Unit 001',
    location: 'Production Floor A',
    motor_type: '775 DC Motor — 24 V',
    status: 'healthy',
    operatingHours: 1842,
    lastMaintenance: '2026-07-14',
    nextMaintenance: '2026-09-14',
    firmware: 'v2.1.4',
    ip: '192.168.1.42',
  },
];

export const MACHINE = MACHINES[0];

// ── Sensor baseline values ────────────────────────────────────────
const BASE = {
  temperature: 38,
  current: 2.1,
  vibration_x: 0.12,
  vibration_y: 0.09,
  vibration_z: 1.44,
};

// ── Numeric jitter ────────────────────────────────────────────────
export const jitter = (base, pct = 0.04) =>
  +(base + base * (Math.random() - 0.5) * 2 * pct).toFixed(3);

// ── Generate a live sensor snapshot ──────────────────────────────
export function generateLiveReading(anomaly = false) {
  const factor = anomaly ? 1.35 : 1;
  const vx = jitter(BASE.vibration_x * factor, 0.12);
  const vy = jitter(BASE.vibration_y * factor, 0.12);
  const vz = jitter(BASE.vibration_z * factor, 0.08);
  return {
    machine_id: 'motor_001',
    timestamp: new Date().toISOString(),
    temperature: jitter(BASE.temperature * factor, 0.06),
    current: jitter(BASE.current * factor, 0.08),
    vibration_x: vx,
    vibration_y: vy,
    vibration_z: vz,
    vibration_magnitude: +(Math.sqrt(vx * vx + vy * vy + vz * vz)).toFixed(3),
  };
}

// ── Build 120-point historical dataset (last 2 hours) ────────────
export function buildHistory(points = 120, anomalyAt = null) {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => {
    const ts = new Date(now - (points - i) * 60_000);
    const anomaly = anomalyAt != null && i >= anomalyAt;
    const factor = anomaly ? 1 + (i - anomalyAt) * 0.018 : 1;
    const vx = jitter(BASE.vibration_x * factor, 0.1);
    const vy = jitter(BASE.vibration_y * factor, 0.1);
    const vz = jitter(BASE.vibration_z * factor, 0.08);
    return {
      time: ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      timestamp: ts.toISOString(),
      temperature: jitter(BASE.temperature * factor, 0.05),
      current: jitter(BASE.current * factor, 0.07),
      vibration_x: vx,
      vibration_y: vy,
      vibration_z: vz,
      vibration_magnitude: +(Math.sqrt(vx * vx + vy * vy + vz * vz)).toFixed(3),
      health_score: anomaly
        ? Math.max(40, 93 - (i - anomalyAt) * 1.8)
        : jitter(93, 0.02),
    };
  });
}

// ── Derive health band ────────────────────────────────────────────
export function healthBand(score) {
  if (score >= 80) return 'healthy';
  if (score >= 60) return 'warning';
  if (score >= 40) return 'critical';
  return 'failure';
}

export function healthLabel(score) {
  const b = healthBand(score);
  return { healthy: 'Healthy', warning: 'Warning', critical: 'Critical', failure: 'Failure Risk' }[b];
}

export function healthColour(score) {
  return {
    healthy: 'var(--status-healthy)',
    warning: 'var(--status-warning)',
    critical: 'var(--status-critical)',
    failure: 'var(--status-failure)',
  }[healthBand(score)];
}

// ── Alert log ─────────────────────────────────────────────────────
export const ALERTS_INITIAL = [
  {
    id: 'a1',
    machine_id: 'motor_001',
    timestamp: new Date(Date.now() - 14 * 60_000).toISOString(),
    severity: 'warning',
    type: 'Vibration Spike',
    message: 'Z-axis vibration exceeded threshold (1.92 g)',
    suspected_cause: 'Possible shaft imbalance',
    status: 'open',
  },
  {
    id: 'a2',
    machine_id: 'motor_001',
    timestamp: new Date(Date.now() - 52 * 60_000).toISOString(),
    severity: 'info',
    type: 'Temperature Rise',
    message: 'Motor temperature increased by 8 °C over 15 min',
    suspected_cause: 'Increased load / ambient temperature',
    status: 'acknowledged',
  },
  {
    id: 'a3',
    machine_id: 'motor_001',
    timestamp: new Date(Date.now() - 3 * 3600_000).toISOString(),
    severity: 'critical',
    type: 'Anomaly Detected',
    message: 'ML model flagged anomaly — score 0.73',
    suspected_cause: 'Bearing wear pattern detected',
    status: 'resolved',
  },
  {
    id: 'a4',
    machine_id: 'motor_001',
    timestamp: new Date(Date.now() - 6 * 3600_000).toISOString(),
    severity: 'warning',
    type: 'Current Surge',
    message: 'Peak current 3.4 A (threshold 3.0 A)',
    suspected_cause: 'Momentary load spike',
    status: 'resolved',
  },
  {
    id: 'a5',
    machine_id: 'motor_001',
    timestamp: new Date(Date.now() - 24 * 3600_000).toISOString(),
    severity: 'info',
    type: 'Sensor Reconnect',
    message: 'ADXL345 reconnected after 3-min dropout',
    suspected_cause: 'Loose I2C connection',
    status: 'resolved',
  },
];

// ── Daily summary stats ───────────────────────────────────────────
export const DAILY_STATS = {
  uptime: '99.2%',
  avg_temp: 39.4,
  avg_current: 2.14,
  avg_vibration: 1.46,
  alerts_today: 2,
  anomalies_today: 1,
  health_score: 87,
};

// ── Feature importance (for ML section) ──────────────────────────
export const FEATURE_IMPORTANCE = [
  { feature: 'Vibration Z', importance: 0.31 },
  { feature: 'Vib. Magnitude', importance: 0.24 },
  { feature: 'Temperature', importance: 0.19 },
  { feature: 'Current RMS', importance: 0.14 },
  { feature: 'Vib. Variance', importance: 0.08 },
  { feature: 'Temp Rate', importance: 0.04 },
];
