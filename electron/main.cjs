const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { setMainWindowGetter } = require('./utils/logger.cjs');
const { registerConfigHandlers } = require('./ipc/config.cjs');
const { registerLogsHandlers } = require('./ipc/logs.cjs');
const { registerUserHandlers } = require('./ipc/user.cjs');
const { registerDeployHandlers } = require('./ipc/deploy.cjs');
const { registerXuiHandlers } = require('./ipc/xui_deploy.cjs');
const { registerMediaHandlers } = require('./ipc/media_deploy.cjs');
const { registerServerHealthHandlers } = require('./ipc/server_health.cjs');
const { registerServerGuisHandlers } = require('./ipc/serverguis_deploy.cjs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
    autoHideMenuBar: true,
    backgroundColor: '#111827'
  });

  setMainWindowGetter(() => mainWindow);

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Register IPC handlers
registerConfigHandlers(ipcMain);
registerLogsHandlers(ipcMain);
registerUserHandlers(ipcMain);
registerDeployHandlers(ipcMain);
registerXuiHandlers(ipcMain);
registerMediaHandlers(ipcMain);
registerServerHealthHandlers(ipcMain);
registerServerGuisHandlers(ipcMain);
