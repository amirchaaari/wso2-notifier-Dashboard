import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, BellRing, Settings, ShieldAlert, Terminal,
  Users, LogOut, Sun, Moon, BarChart3, BookOpen, Activity, ClipboardList,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { incidentsApi } from '../api/incidentsApi';

const navLinkStyle = ({ isActive }) => ({
  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem',
  borderRadius: '0.5rem', textDecoration: 'none',
  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
  background: isActive ? 'var(--nav-active-bg)' : 'transparent',
  fontWeight: isActive ? 500 : 400,
  fontSize: '0.875rem',
  transition: 'all 0.2s ease',
});

const sectionLabel = {
  fontSize: '0.65rem',
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
  color: 'var(--text-secondary)',
  fontWeight: 700,
  padding: '0.75rem 1rem 0.3rem',
  opacity: 0.7,
};

const Sidebar = () => {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [openIncidentsCount, setOpenIncidentsCount] = useState(0);

  useEffect(() => {
    const fetchOpenIncidentsCount = async () => {
      if (!user) return;
      try {
        const response = await incidentsApi.getOpenIncidentsCount();
        setOpenIncidentsCount(response.count);
      } catch (error) {
        console.error('Failed to fetch open incidents count:', error);
      }
    };

    fetchOpenIncidentsCount();
    const intervalId = setInterval(fetchOpenIncidentsCount, 15000);

    return () => clearInterval(intervalId);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="glass-panel" style={{
      width: '240px', borderRadius: 0,
      borderTop: 0, borderLeft: 0, borderBottom: 0,
      padding: '1.75rem 0.75rem',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '0 0.5rem' }}>
          <div style={{ background: 'var(--accent-gradient)', padding: '0.5rem', borderRadius: '0.5rem', flexShrink: 0 }}>
            <ShieldAlert size={22} color="white" />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.15rem', letterSpacing: '-0.025em' }}>WSO2 Notifier</h2>
        </div>

        {/* ── Analytics section ── */}
        <div style={sectionLabel}>Analytics</div>
        <NavLink to="/analytics" end style={navLinkStyle}><BarChart3 size={17} /> Overview</NavLink>
        <NavLink to="/analytics/rules" style={navLinkStyle}><Activity size={17} /> Rule Insights</NavLink>

        {/* ── Main navigation ── */}
        <div style={sectionLabel}>Management</div>
        <NavLink to="/" end style={navLinkStyle}><LayoutDashboard size={17} /> Rules Dashboard</NavLink>
        <NavLink to="/incidents" style={navLinkStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BellRing size={17} /> Incidents
            </div>
            {openIncidentsCount > 0 && (
              <span style={{
                background: 'var(--status-critical)',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.1rem 0.4rem',
                borderRadius: '1rem',
              }}>
                {openIncidentsCount}
              </span>
            )}
          </div>
        </NavLink>
        <NavLink to="/custom-rules" style={navLinkStyle}><Terminal size={17} /> Custom Rules</NavLink>
        <NavLink to="/audit" style={navLinkStyle}><ClipboardList size={17} /> Audit Log</NavLink>

        {/* ── Bottom section ── */}
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)', marginLeft: '0.25rem', marginRight: '0.25rem', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {isAdmin() && (
            <NavLink to="/users" style={navLinkStyle}><Users size={17} /> User Management</NavLink>
          )}
          <NavLink to="/settings" style={navLinkStyle}><Settings size={17} /> Settings</NavLink>
          <NavLink to="/docs" style={navLinkStyle}><BookOpen size={17} /> Documentation</NavLink>
        </div>

        {/* Theme toggle */}
        <div style={{ marginTop: '1rem', padding: '0 0.25rem' }}>
          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', padding: '0.55rem 0.75rem' }}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <><Sun size={14} /> Light theme</> : <><Moon size={14} /> Dark theme</>}
          </button>
        </div>
      </div>

      {/* User info + logout */}
      <div style={{
        padding: '0.75rem 0.75rem 0',
        borderTop: '1px solid var(--border-glass)',
        marginTop: '1rem',
        display: 'flex', alignItems: 'center', gap: '0.65rem',
      }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, color: 'white', fontSize: '0.9rem',
        }}>
          {user?.username?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.username}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{user?.role}</div>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem', display: 'flex', alignItems: 'center', borderRadius: '0.25rem', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--status-critical)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
