import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ClockArea from './components/ClockArea';
import TaskArea from './components/TaskArea';
import BlockedAppsList from './components/BlockedAppsList';
import LiveWallpaper from './components/LiveWallpaper';

function App() {
  const [theme, setTheme] = useState('dark');
  const [unlockTier, setUnlockTier] = useState(0); // 0: All Locked, 1: Prod, 2: Msg, 3: All Unlocked
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Sync unlock tier with Electron backend
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.setUnlockTier) {
      window.electronAPI.setUnlockTier(unlockTier);
    }
  }, [unlockTier]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const startNewSession = () => {
    setUnlockTier(0);
  };

  return (
    <>
      <LiveWallpaper theme={theme} />
      <div className="dashboard-grid" style={{ position: 'relative', zIndex: 1 }}>
      <Sidebar theme={theme} toggleTheme={toggleTheme} userLevel={userLevel} userXP={userXP} />
      <ClockArea unlockTier={unlockTier} />
      <TaskArea 
        unlockTier={unlockTier} 
        setUnlockTier={setUnlockTier}
        setUserLevel={setUserLevel}
        setUserXP={setUserXP}
        userLevel={userLevel}
        startNewSession={startNewSession}
      />
      <BlockedAppsList unlockTier={unlockTier} />
      </div>
    </>
  );
}

export default App;
