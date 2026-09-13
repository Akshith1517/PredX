import { Settings2, Server, Sliders, Bell } from 'lucide-react';
import PageShell from '../components/PageShell';

function SettingRow({ label, desc, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.82)' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.32)', marginTop: 2 }}>{desc}</div>}
      </div>
      <div style={{ minWidth: 180 }}>{children}</div>
    </div>
  );
}

export default function Settings() {
  return (
    <PageShell title="Settings" subtitle="Sensor thresholds, MQTT configuration & alert preferences">
      <div style={{ maxWidth: 780 }}>

        {/* Sensor Thresholds */}
        <div className="glass-card animate-float-in" style={{ padding: '24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Sliders size={16} color="var(--gold-bright)" />
            <div className="section-heading">Sensor Thresholds</div>
          </div>
          {[
            { label: 'Temperature Warning', desc: 'Trigger a warning alert above this value', unit: '°C', default: '55' },
            { label: 'Temperature Critical', desc: 'Trigger a critical alert above this value', unit: '°C', default: '70' },
            { label: 'Current Threshold', desc: 'Alert when motor current exceeds', unit: 'A', default: '3.0' },
            { label: 'Vibration Threshold', desc: 'Alert when magnitude exceeds', unit: 'g', default: '2.0' },
            { label: 'Z-Axis Threshold', desc: 'Dedicated Z-axis spike detection', unit: 'g', default: '1.8' },
          ].map(({ label, desc, unit, default: def }) => (
            <SettingRow key={label} label={label} desc={desc}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input className="input" defaultValue={def} style={{ textAlign: 'right', width: 100, fontFamily: 'var(--font-mono)' }} />
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)', width: 24 }}>{unit}</span>
              </div>
            </SettingRow>
          ))}
        </div>

        {/* MQTT Config */}
        <div className="glass-card animate-float-in" style={{ padding: '24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Server size={16} color="var(--gold-bright)" />
            <div className="section-heading">MQTT / Backend Configuration</div>
          </div>
          {[
            { label: 'Broker Host',   desc: 'Eclipse Mosquitto host address',  default: 'localhost',          type: 'text' },
            { label: 'Broker Port',   desc: 'MQTT port (default 1883)',         default: '1883',               type: 'number' },
            { label: 'Topic',         desc: 'ESP32 publish topic',              default: 'factory/motor1/sensors', type: 'text' },
            { label: 'API Base URL',  desc: 'FastAPI backend endpoint',         default: 'http://localhost:8001', type: 'text' },
          ].map(({ label, desc, default: def, type }) => (
            <SettingRow key={label} label={label} desc={desc}>
              <input className="input" defaultValue={def} type={type} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }} />
            </SettingRow>
          ))}
        </div>

        {/* Alert Preferences */}
        <div className="glass-card animate-float-in" style={{ padding: '24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Bell size={16} color="var(--gold-bright)" />
            <div className="section-heading">Alert Preferences</div>
          </div>
          {[
            { label: 'Browser Notifications', desc: 'Show native OS notifications on critical alerts' },
            { label: 'Sound Alerts',          desc: 'Play a chime when a critical event fires' },
            { label: 'Auto-acknowledge Info', desc: 'Automatically acknowledge info-level alerts' },
          ].map(({ label, desc }) => (
            <SettingRow key={label} label={label} desc={desc}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', justifyContent: 'flex-end' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--gold-bright)', width: 16, height: 16, cursor: 'pointer' }} />
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>Enabled</span>
              </label>
            </SettingRow>
          ))}
        </div>

        {/* ML Model */}
        <div className="glass-card animate-float-in" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Settings2 size={16} color="var(--gold-bright)" />
            <div className="section-heading">ML Model Configuration</div>
          </div>
          {[
            { label: 'Model Path',     desc: 'Path to serialised model file (.joblib)', default: './ml/models/isolation_forest_v1.joblib' },
            { label: 'Model Version',  desc: 'Active model version tag',                default: 'v1.2.0' },
            { label: 'Anomaly Threshold', desc: 'Decision threshold for anomaly flag (0–1)', default: '0.5' },
          ].map(({ label, desc, default: def }) => (
            <SettingRow key={label} label={label} desc={desc}>
              <input className="input" defaultValue={def} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }} />
            </SettingRow>
          ))}
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button className="btn btn-gold">Save Changes</button>
            <button className="btn btn-ghost">Reset Defaults</button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
