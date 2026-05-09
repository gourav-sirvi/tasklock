import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  setUnlockTier: (tier) => ipcRenderer.send('set-unlock-tier', tier)
});
