import React from 'react';
import { LayoutDashboard, BellRing, Settings, ShieldAlert } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="glass-panel" style={{ width: '260px', borderRadius: 0, borderTop: 0, borderLeft: 0, borderBottom: 0, padding: '2rem 1rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem', padding: '0 0.5rem' }}>
        <div style={{ background: 'var(--accent-gradient)', padding: '0.5rem', borderRadius: '0.5rem' }}>
          <ShieldAlert size={24} color="white" />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', letterSpacing: '-0.025em' }}>WSO2 Notifier</h2>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <NavLink to="/" end style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
          borderRadius: '0.5rem', textDecoration: 'none', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          fontWeight: isActive ? 500 : 400,
          transition: 'all 0.2s ease'
        })}>
          <LayoutDashboard size={20} />
          Rules Dashboard
        </NavLink>
        
        <NavLink to="/incidents" style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
          borderRadius: '0.5rem', textDecoration: 'none', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          fontWeight: isActive ? 500 : 400,
          transition: 'all 0.2s ease'
        })}>
          <BellRing size={20} />
          Incidents Check
        </NavLink>
        
        <NavLink to="/settings" style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
          borderRadius: '0.5rem', textDecoration: 'none', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          fontWeight: isActive ? 500 : 400,
          transition: 'all 0.2s ease'
        })}>
          <Settings size={20} />
          Settings
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
