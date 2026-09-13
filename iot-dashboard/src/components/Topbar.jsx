import { Bell, Wifi, WifiOff, RefreshCw, Server, Cpu, RadioTower } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../data/api';

const DATA_SOURCE_CONFIG = {
  live: {
    label: 'ESP32 Live',
    color: 'var(--status-healthy)',
    bg: 'rgba(34,211,165,0.08)',
    border: 'rgba(34,211,165,0.2)',
    icon: Cpu,
    pulse: true,
  },
  mock: {
    label: 'Simulated',
    color: 'var(--gold-bright)',
    bg: 'rgba(240,180,41,0.08)',
    border: 'rgba(240,180,41,0.2)',
    icon: RadioTower,
    pulse: false,
  },
  stale: {
    label: 'ESP32 Stale',
    color: 'var(--status-critical)',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.2)',
    icon: WifiOff,
    pulse: false,
  },
};

export default function Topbar({ title, subtitle, connected, anomaly, dataSource = 'mock' }) {
  const [backendOk, setBackendOk] = useState(null);
  const [tick, setTick] = useState(0); // forces timestamp to re-render

  useEffect(() => {
    const check = () =>
      api.ping()
        .then(() => setBackendOk(true))
        .catch(() => setBackendOk(false));
    check();
    const apiId = setInterval(check, 10_000);

    // Update clock every second
    const clockId = setInterval(() => setTick(t => t + 1), 1000);

    return () => {
      clearInterval(apiId);
      clearInterval(clockId);
    };
  }, []);

  const now = new Date().toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  const ds = DATA_SOURCE_CONFIG[dataSource] ?? DATA_SOURCE_CONFIG.mock;
  const DsIcon = ds.icon;

  return (
    <header style={{
      height: 'var(--topbar-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--space-8)',
      borderBottom: '1px solid var(--glass-border)',
      background: 'rgba(7, 10, 18, 0.7)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Left — page title */}
      <div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.15rem',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.92)',
          letterSpacing: '-0.01em',
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Right — status chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Live clock */}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          color: 'rgba(255,255,255,0.28)',
        }}>
          {now}
        </span>

        {/* Anomaly badge */}
        {anomaly && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(249,115,22,0.15)',
            border: '1px solid rgba(249,115,22,0.3)',
            color: 'var(--status-critical)',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            animation: 'glow-pulse 2s ease-in-out infinite',
          }}>
            <RefreshCw size={10} />
            Anomaly
          </span>
        )}

        {/* ── Data source chip — the key indicator ── */}
        <span style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          background: ds.bg,
          border: `1px solid ${ds.border}`,
          fontSize: '0.72rem',
          fontWeight: 700,
          color: ds.color,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {/* Pulsing dot for live mode */}
          {ds.pulse
            ? <span style={{
                position: 'relative',
                width: 7, height: 7,
                borderRadius: '50%',
                background: ds.color,
                display: 'inline-block',
                animation: 'pulse-dot 1.5s ease-in-out infinite',
              }} />
            : <DsIcon size={11} />
          }
          {ds.label}
        </span>

        {/* Backend API status */}
        <span style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          background: backendOk === true
            ? 'rgba(34,211,165,0.08)'
            : backendOk === false
              ? 'rgba(239,68,68,0.08)'
              : 'rgba(107,114,128,0.08)',
          border: `1px solid ${backendOk === true
            ? 'rgba(34,211,165,0.2)'
            : backendOk === false
              ? 'rgba(239,68,68,0.2)'
              : 'rgba(107,114,128,0.2)'}`,
          fontSize: '0.72rem',
          fontWeight: 600,
          color: backendOk === true
            ? 'var(--status-healthy)'
            : backendOk === false
              ? 'var(--status-failure)'
              : 'var(--status-offline)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          <Server size={11} />
          {backendOk === null ? 'API…' : backendOk ? 'API Online' : 'API Offline'}
        </span>

        {/* MQTT / Device connection */}
        <span style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          background: connected ? 'rgba(34,211,165,0.08)' : 'rgba(107,114,128,0.1)',
          border: `1px solid ${connected ? 'rgba(34,211,165,0.2)' : 'rgba(107,114,128,0.2)'}`,
          fontSize: '0.72rem',
          fontWeight: 600,
          color: connected ? 'var(--status-healthy)' : 'var(--status-offline)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
          {connected ? 'MQTT Live' : 'No Device'}
        </span>

        {/* Alert bell */}
        <button style={{
          position: 'relative',
          width: 36, height: 36,
          borderRadius: 'var(--radius-md)',
          background: 'var(--glass-1)',
          border: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.55)',
        }}>
          <Bell size={15} />
          <span style={{
            position: 'absolute',
            top: 6, right: 6,
            width: 7, height: 7,
            borderRadius: '50%',
            background: 'var(--status-failure)',
            border: '1.5px solid var(--bg-deep)',
          }} />
        </button>
      </div>
    </header>
  );
}
