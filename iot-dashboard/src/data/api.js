/**
 * Thin API client — wraps fetch calls to the FastAPI backend.
 * Falls back gracefully when backend is unreachable (mock data keeps working).
 */
const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8001';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function patch(path) {
  const res = await fetch(`${BASE}${path}`, { method: 'PATCH' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  // Root health ping
  ping: ()                   => get('/'),

  // Machines
  getMachines: ()            => get('/machines'),
  getMachine: (id)           => get(`/machines/${id}`),

  // Sensor data
  getSensorData: (machineId, limit = 100) =>
    get(`/sensor-data?machine_id=${machineId}&limit=${limit}`),
  getLiveReading: (machineId) => get(`/sensor-data/live/${machineId}`),
  ingestReading: (payload)   => post('/sensor-data', payload),

  // Simulate (demo endpoint)
  simulate: (machineId, anomaly = false) =>
    post(`/simulate/${machineId}?anomaly=${anomaly}`, {}),

  // Alerts
  getAlerts: (machineId)     => get(`/alerts?machine_id=${machineId}`),
  acknowledgeAlert: (id)     => patch(`/alerts/${id}?status=acknowledged`),
  resolveAlert: (id)         => patch(`/alerts/${id}?status=resolved`),

  // Health status
  getHealthStatus: (machineId) =>
    get(`/health-status?machine_id=${machineId}`),
};
