/**
 * useLiveSensor — Hybrid real/mock sensor hook
 * ─────────────────────────────────────────────
 * Priority order every poll cycle:
 *  1. GET /sensor-data/live/motor_001  → real ESP32 reading from backend
 *  2. GET /sensor-data?limit=60        → real history from backend
 *  3. If backend unreachable OR returns seed/stale data → fall back to mock
 *
 * The `dataSource` value tells the UI which mode is active:
 *   "live"    — real ESP32 data flowing in
 *   "mock"    — simulated data (no device connected yet)
 *   "stale"   — backend reachable but ESP32 not sending new readings
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  generateLiveReading,
  buildHistory,
  healthBand,
  DAILY_STATS,
} from '../data/mockData';
import { api } from '../data/api';

const HISTORY_LEN   = 60;
const STALE_THRESH  = 15_000;   // if latest reading is >15 s old → "stale"
const POLL_INTERVAL = 2_000;    // how often we poll the backend (ms)

// ── Helpers ───────────────────────────────────────────────────────

/** Normalise a raw API reading into the shape the UI expects */
function normaliseReading(raw) {
  const vx  = raw.vibration_x  ?? 0;
  const vy  = raw.vibration_y  ?? 0;
  const vz  = raw.vibration_z  ?? 0;
  const mag = raw.vibration_magnitude
    ?? Math.sqrt(vx * vx + vy * vy + vz * vz);
  return {
    machine_id:          raw.machine_id  ?? 'motor_001',
    timestamp:           raw.timestamp   ?? new Date().toISOString(),
    temperature:         raw.temperature ?? 0,
    current:             raw.current     ?? 0,
    vibration_x:         vx,
    vibration_y:         vy,
    vibration_z:         vz,
    vibration_magnitude: +mag.toFixed(4),
    // extra fields the ESP32 sends (may be undefined for seeded rows)
    rpm:                 raw.rpm         ?? null,
    bus_voltage_v:       raw.bus_voltage_v ?? null,
    power_mw:            raw.power_mw    ?? null,
  };
}

/** Add a display `time` label for chart x-axis */
function withTimeLabel(r) {
  return {
    ...r,
    time: new Date(r.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
    }),
  };
}

/** Derive a health score from real sensor values using threshold model */
function deriveHealthScore(reading, mlHealth) {
  // If the backend supplied an ML score, use it
  if (mlHealth != null && mlHealth > 0) return mlHealth;

  // Fallback: weighted threshold scoring
  let score = 100;
  const t = reading.temperature ?? 0;
  const i = reading.current     ?? 0;
  const v = reading.vibration_magnitude ?? 0;

  if (t > 70)       score -= 40;
  else if (t > 55)  score -= 20;
  else if (t > 45)  score -= 8;

  if (i > 1.6)      score -= 30;
  else if (i > 1.2) score -= 15;
  else if (i > 0.9) score -= 5;

  if (v > 3.0)      score -= 30;
  else if (v > 2.0) score -= 18;
  else if (v > 1.5) score -= 7;

  return Math.max(5, Math.min(100, score));
}

// ════════════════════════════════════════════════════════════════════
export function useLiveSensor(intervalMs = POLL_INTERVAL) {
  // ── State ─────────────────────────────────────────────────────
  const [latest,      setLatest]      = useState(() => generateLiveReading());
  const [history,     setHistory]     = useState(() => buildHistory(HISTORY_LEN));
  const [healthScore, setHealthScore] = useState(DAILY_STATS.health_score);
  const [anomaly,     setAnomaly]     = useState(false);
  const [connected,   setConnected]   = useState(true);  // MQTT/WiFi status
  const [dataSource,  setDataSource]  = useState('mock'); // 'live' | 'mock' | 'stale'

  // ── Refs ──────────────────────────────────────────────────────
  const mockAnomalyRef = useRef(false);  // for mock-mode anomaly simulation
  const lastRealTsRef  = useRef(null);   // ISO timestamp of last real reading

  // ── Mock fallback ticker ──────────────────────────────────────
  const mockTickRef = useRef(null);

  const startMockMode = useCallback(() => {
    if (mockTickRef.current) return; // already running
    mockTickRef.current = setInterval(() => {
      const reading = generateLiveReading(mockAnomalyRef.current);
      setHealthScore(prev => {
        const drift = mockAnomalyRef.current ? -0.4 : 0.15;
        return Math.min(100, Math.max(10,
          +(prev + drift + (Math.random() - 0.5) * 0.3).toFixed(1)));
      });
      setLatest(reading);
      setHistory(prev => [...prev.slice(1), withTimeLabel(reading)]);
    }, intervalMs);
  }, [intervalMs]);

  const stopMockMode = useCallback(() => {
    if (mockTickRef.current) {
      clearInterval(mockTickRef.current);
      mockTickRef.current = null;
    }
  }, []);

  // ── Real-data poller ──────────────────────────────────────────
  useEffect(() => {
    let pollId;

    async function poll() {
      try {
        // 1. Fetch latest single reading
        const raw = await api.getLiveReading('motor_001');
        const reading = normaliseReading(raw);
        const readingAge = Date.now() - new Date(reading.timestamp).getTime();

        if (readingAge > STALE_THRESH) {
          // Backend has data but ESP32 stopped sending
          setDataSource('stale');
          setConnected(false);
          startMockMode();
          return;
        }

        // ── Real fresh data ──────────────────────────────────
        stopMockMode();
        setDataSource('live');
        setConnected(true);
        lastRealTsRef.current = reading.timestamp;

        // 2. Fetch real history (last 60 readings)
        const histRaw = await api.getSensorData('motor_001', HISTORY_LEN);
        const hist = [...histRaw]
          .reverse()  // API returns newest-first; charts need oldest-first
          .map(withTimeLabel);

        // 3. Get ML health score
        let mlHealth = null;
        try {
          const hs = await api.getHealthStatus('motor_001');
          if (Array.isArray(hs) && hs.length > 0) mlHealth = hs[0].health_score;
          else if (hs?.health_score) mlHealth = hs.health_score;
        } catch (_) { /* not fatal */ }

        const score = deriveHealthScore(reading, mlHealth);

        setLatest(reading);
        setHistory(hist.length >= 2 ? hist : prev => prev); // keep prev if too few points
        setHealthScore(score);
        setAnomaly(score < 60);

      } catch (err) {
        // Backend unreachable → use mock
        if (dataSource !== 'mock') {
          setDataSource('mock');
          setConnected(false);
        }
        startMockMode();
      }
    }

    // Run immediately then on interval
    poll();
    pollId = setInterval(poll, intervalMs);

    return () => {
      clearInterval(pollId);
      stopMockMode();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  // ── Manual controls (demo / testing) ─────────────────────────
  const triggerAnomaly = () => {
    mockAnomalyRef.current = true;
    setAnomaly(true);
  };
  const clearAnomaly = () => {
    mockAnomalyRef.current = false;
    setAnomaly(false);
  };
  const toggleConnect = () => setConnected(p => !p);

  return {
    latest,
    history,
    healthScore,
    healthStatus: healthBand(healthScore),
    anomaly,
    connected,
    dataSource,   // NEW — 'live' | 'mock' | 'stale'
    triggerAnomaly,
    clearAnomaly,
    toggleConnect,
  };
}
