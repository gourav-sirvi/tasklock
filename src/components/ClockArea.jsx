import React, { useState, useEffect } from 'react';
import { Lock, Unlock, CloudRain, Clock as ClockIcon, Wind } from 'lucide-react';

const ClockArea = ({ unlockTier }) => {
  const isLocked = unlockTier < 3;
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Lock Status */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'auto' }}>
        <div className="glass-panel" style={{ 
          display: 'flex', alignItems: 'center', gap: '16px', 
          padding: '12px 24px', borderRadius: '50px' 
        }}>
          {isLocked ? (
            <Lock color="var(--danger-color)" size={24} />
          ) : (
            <Unlock color="#10b981" size={24} />
          )}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: isLocked ? 'var(--danger-color)' : '#10b981' }}>
              Access {isLocked ? 'Locked' : 'Unlocked'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {isLocked ? 'Complete your task to unlock applications' : 'Applications are now unlocked'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Clock */}
      <div style={{ textAlign: 'center', margin: 'auto 0' }}>
        <h1 style={{ fontSize: '96px', fontWeight: '700', letterSpacing: '-2px', margin: '0' }}>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </h1>
        <h2 style={{ fontSize: '24px', color: 'var(--text-accent)', fontWeight: '500', marginTop: '16px' }}>
          {time.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </h2>
        <p style={{ fontSize: '16px', fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: '32px' }}>
          "Discipline today, freedom tomorrow."
        </p>
      </div>

      {/* Bottom Widgets */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: 'auto' }}>
        <Widget icon={<Wind size={24} />} title="28°C" subtitle="Clear" />
        <Widget icon={<ClockIcon size={24} />} title="Focus" subtitle="2h 15m" />
        <Widget icon={<CloudRain size={24} />} title="Rain" subtitle="On" />
      </div>
    </div>
  );
};

const Widget = ({ icon, title, subtitle }) => (
  <div className="glass-panel" style={{ 
    display: 'flex', alignItems: 'center', gap: '12px', 
    padding: '12px 24px', borderRadius: '24px',
    cursor: 'pointer'
  }}>
    <div style={{ color: 'var(--text-accent)' }}>{icon}</div>
    <div>
      <div style={{ fontWeight: '600', fontSize: '14px' }}>{title}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{subtitle}</div>
    </div>
  </div>
);

export default ClockArea;
