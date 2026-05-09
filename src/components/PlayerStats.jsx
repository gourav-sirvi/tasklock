import React from 'react';
import { Shield, Sword, Star } from 'lucide-react';

const PlayerStats = ({ userLevel, userXP }) => {
  const xpNeeded = userLevel * 100;
  const progressPercent = (userXP / xpNeeded) * 100;

  const getRank = (level) => {
    if (level < 5) return 'Mizunoto (Initiate)';
    if (level < 10) return 'Kinoe (Veteran)';
    return 'Hashira (Master)';
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--accent-color)" />
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Level {userLevel}</span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-accent)' }}>
          {getRank(userLevel)}
        </span>
      </div>
      
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
          <span>XP Progress</span>
          <span>{userXP} / {xpNeeded}</span>
        </div>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${Math.min(progressPercent, 100)}%`, background: 'var(--accent-color)' }}></div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStats;
