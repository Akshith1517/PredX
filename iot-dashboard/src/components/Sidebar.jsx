import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Activity, HeartPulse, BarChart3,
  BellRing, Settings, Cpu, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { path: '/',          label: 'Dashboard',      icon: LayoutDashboard },
  { path: '/live',      label: 'Live Sensors',   icon: Activity },
  { path: '/health',    label: 'Machine Health', icon: HeartPulse },
  { path: '/analytics', label: 'Analytics',      icon: BarChart3 },
  { path: '/alerts',    label: 'Alerts',         icon: BellRing, badge: 2 },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      style={{
        width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(7, 10, 18, 0.92)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderRight: '1px solid var(--glass-border)',
        transition: 'width var(--transition-slow)',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '20px 18px',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 72,
        overflow: 'hidden',
      }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, var(--gold-dim), var(--gold-bright))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 18px var(--gold-glow)',
        }}>
          <Cpu size={18} color="#0c0a04" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#fff', letterSpacing: '-0.01em' }}>
              PredX
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--gold-mid)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 1 }}>
              Predictive Maintenance
            </div>
          </div>
        )}
      </div>

      {/* Machine badge */}
      {!collapsed && (
        <div style={{
          margin: '14px 14px 4px',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--glass-1)',
          border: '1px solid var(--glass-border)',
        }}>
          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Active Machine
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="live-dot" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>
              Motor Unit 001
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', marginTop: 3 }}>
            Production Floor A
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_ITEMS.map(({ path, label, icon: Icon, badge }) => {
          const active = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);
          return (
            <NavLink
              key={path}
              to={path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '12px 18px' : '11px 14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: 4,
                textDecoration: 'none',
                transition: 'all var(--transition-normal)',
                position: 'relative',
                background: active
                  ? 'linear-gradient(135deg, rgba(240,180,41,0.12), rgba(240,180,41,0.05))'
                  : 'transparent',
                border: active
                  ? '1px solid rgba(240,180,41,0.2)'
                  : '1px solid transparent',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.2 : 1.8}
                color={active ? 'var(--gold-bright)' : 'rgba(255,255,255,0.5)'}
                style={{ flexShrink: 0, transition: 'color var(--transition-fast)' }}
              />
              {!collapsed && (
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.55)',
                  transition: 'color var(--transition-fast)',
                  whiteSpace: 'nowrap',
                }}>
                  {label}
                </span>
              )}
              {!collapsed && badge != null && (
                <span style={{
                  marginLeft: 'auto',
                  background: 'var(--status-failure)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  lineHeight: 1.5,
                }}>
                  {badge}
                </span>
              )}
              {active && (
                <span style={{
                  position: 'absolute',
                  left: 0, top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3, height: '60%',
                  background: 'linear-gradient(180deg, var(--gold-bright), var(--gold-dim))',
                  borderRadius: '0 2px 2px 0',
                }} />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom — Settings + collapse toggle */}
      <div style={{ borderTop: '1px solid var(--glass-border)', padding: '10px 10px' }}>
        <NavLink
          to="/settings"
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: collapsed ? '12px 18px' : '11px 14px',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            justifyContent: collapsed ? 'center' : 'flex-start',
            marginBottom: 4,
          }}
        >
          <Settings size={18} strokeWidth={1.8} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }}>Settings</span>}
        </NavLink>

        <button
          onClick={() => setCollapsed(p => !p)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '10px 18px' : '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--glass-1)',
            border: '1px solid var(--glass-border)',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.38)',
            fontSize: '0.8rem',
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'all var(--transition-normal)',
          }}
        >
          {collapsed
            ? <ChevronRight size={15} />
            : <><ChevronLeft size={15} /><span>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  );
}
