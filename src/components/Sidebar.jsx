import React from 'react';
import { Lock, Home, CheckCircle, Shield, BarChart2, Settings, Moon, Sun } from 'lucide-react';
import PlayerStats from './PlayerStats';

const Sidebar = ({ theme, toggleTheme, userLevel, userXP }) => {
  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
        <Lock size={28} color="var(--accent-color)" />
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>TaskLock</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Focus. Complete. Access.</p>
        </div>
      </div>

      <PlayerStats userLevel={userLevel} userXP={userXP} />

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <NavItem icon={<Home size={20} />} label="Home" active />
        <NavItem icon={<CheckCircle size={20} />} label="Task" />
        <NavItem icon={<Shield size={20} />} label="Blocked Apps" />
        <NavItem icon={<BarChart2 size={20} />} label="Statistics" />
        <NavItem icon={<Settings size={20} />} label="Settings" />
      </nav>

      <button 
        onClick={toggleTheme}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent',
          border: '1px solid var(--panel-border)', padding: '12px 16px', borderRadius: '12px',
          color: 'var(--text-primary)', cursor: 'pointer', transition: 'var(--transition)'
        }}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
      </button>
    </div>
  );
};

const NavItem = ({ icon, label, active }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
    borderRadius: '12px', cursor: 'pointer',
    background: active ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
    color: active ? 'var(--accent-color)' : 'var(--text-secondary)',
    fontWeight: active ? '600' : '400',
    transition: 'var(--transition)'
  }}>
    {icon}
    <span>{label}</span>
  </div>
);

export default Sidebar;
