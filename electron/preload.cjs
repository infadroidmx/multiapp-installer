const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    saveConfig: (data) => ipcRenderer.invoke('save-config', data),
    loadConfig: () => ipcRenderer.invoke('load-config'),
    saveAppConfig: (appId, data) => ipcRenderer.invoke('save-app-config', appId, data),
    loadAppConfig: (appId) => ipcRenderer.invoke('load-app-config', appId),
    deployServer: (config, mode) => ipcRenderer.invoke('deploy-server', config, mode),
    testServerConnection: (config, options) => ipcRenderer.invoke('test-server-connection', config, options),
    scanPostizServer: (config) => ipcRenderer.invoke('scan-postiz-server', config),
    deployMedia: (config, mode) => ipcRenderer.invoke('deploy-media', config, mode),
    scanMediaServer: (config) => ipcRenderer.invoke('scan-media-server', config),
    deployXui: (config, mode) => ipcRenderer.invoke('deploy-xui', config, mode),
    scanXuiServer: (config) => ipcRenderer.invoke('scan-xui-server', config),
    deployServerGuis: (config, mode, selectedGui, installScript) => ipcRenderer.invoke('deploy-serverguis', config, mode, selectedGui, installScript),
    scanServerGuis: (config) => ipcRenderer.invoke('scan-serverguis', config),
    fetchLogs: (config) => ipcRenderer.invoke('fetch-logs', config),
    createUser: (config, name, email, password) => ipcRenderer.invoke('create-user', config, name, email, password),
    onLogMessage: (callback) => {
        ipcRenderer.removeAllListeners('log-message');
        ipcRenderer.on('log-message', (_event, value) => callback(value));
    }
});
