import React from 'react';
import { Lock, Unlock } from 'lucide-react';

const BlockedAppsList = ({ unlockTier }) => {
  const tiers = [
    {
      level: 1,
      title: 'Productivity',
      req: '10 Reps',
      apps: [
        { name: 'VS Code', icon: 'https://cdn-icons-png.flaticon.com/512/802/802308.png' },
        { name: 'Notion', icon: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png' }
      ]
    },
    {
      level: 2,
      title: 'Messaging',
      req: '20 Reps',
      apps: [
        { name: 'WhatsApp', icon: 'https://cdn-icons-png.flaticon.com/512/1384/1384055.png' },
        { name: 'Discord', icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968756.png' }
      ]
    },
    {
      level: 3,
      title: 'Heavy Distractions',
      req: '30 Reps',
      apps: [
        { name: 'Chrome', icon: 'https://cdn-icons-png.flaticon.com/512/732/732226.png' },
        { name: 'YouTube', icon: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' }
      ]
    }
  ];

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        {unlockTier < 3 ? <Lock size={20} color="var(--text-accent)" /> : <Unlock size={20} color="#10b981" />}
        <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Tiered Unlocks</h3>
      </div>
      
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Complete milestones to unlock application tiers.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {tiers.map(tier => {
          const isTierUnlocked = unlockTier >= tier.level;
          return (
            <div key={tier.level} style={{ borderLeft: `2px solid ${isTierUnlocked ? '#10b981' : 'var(--danger-color)'}`, paddingLeft: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: isTierUnlocked ? '#10b981' : 'var(--danger-color)' }}>
                  TIER {tier.level}: {tier.title}
                </span>
                {!isTierUnlocked && <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--danger-color)' }}>Requires {tier.req}</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tier.apps.map(app => (
                  <div key={app.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: isTierUnlocked ? 1 : 0.6 }}>
                    <img src={app.icon} alt={app.name} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{app.name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.6' }}>
          "The bridge between goals and achievement is discipline."
        </p>
      </div>
    </div>
  );
};

export default BlockedAppsList;
