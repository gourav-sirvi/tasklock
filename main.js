import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let blockInterval = null;
let currentUnlockTier = 0;

const tier1Apps = ['Code.exe', 'Notion.exe']; // Productivity
const tier2Apps = ['whatsapp.exe', 'Discord.exe']; // Messaging
const tier3Apps = ['chrome.exe', 'msedge.exe']; // Heavy Distractions

// System command to kill apps
function killBlockedApps() {
  const isWindows = process.platform === 'win32';
  if (!isWindows) return;

  let appsToBlock = [];
  if (currentUnlockTier < 1) appsToBlock.push(...tier1Apps);
  if (currentUnlockTier < 2) appsToBlock.push(...tier2Apps);
  if (currentUnlockTier < 3) appsToBlock.push(...tier3Apps);

  appsToBlock.forEach((appName) => {
    // Check and kill
    // Use taskkill /IM appName /F
    exec(`tasklist | findstr /I "${appName}"`, (err, stdout) => {
      if (stdout) {
        exec(`taskkill /IM "${appName}" /F`, (killErr) => {
          if (!killErr) {
            console.log(`Killed ${appName}`);
          }
        });
      }
    });
  });
}

function startBlocking() {
  if (blockInterval) clearInterval(blockInterval);
  blockInterval = setInterval(killBlockedApps, 2000); // Check every 2 seconds
  killBlockedApps(); // Initial check
}

function stopBlocking() {
  if (blockInterval) {
    clearInterval(blockInterval);
    blockInterval = null;
    console.log('Stopped blocking');
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // uncomment for full screen immersive experience
    // fullscreen: true,
    // autoHideMenuBar: true,
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    // Wait for Vite to start
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  // Auto-allow camera permissions
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      return callback(true);
    }
    callback(false);
  });

  createWindow();

  // IPC Handlers
  ipcMain.on('set-unlock-tier', (event, tier) => {
    currentUnlockTier = tier;
    if (tier < 3) {
      startBlocking(); // Start or keep blocking remaining tiers
    } else {
      stopBlocking(); // All tiers unlocked
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
