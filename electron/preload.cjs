const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    saveConfig: (data) => ipcRenderer.invoke('save-config', data),
    loadConfig: () => ipcRenderer.invoke('load-config'),
    deployServer: (config, mode) => ipcRenderer.invoke('deploy-server', config, mode),
    fetchLogs: (config) => ipcRenderer.invoke('fetch-logs', config),
    createUser: (config, name, email, password) => ipcRenderer.invoke('create-user', config, name, email, password),
    onLogMessage: (callback) => {
        ipcRenderer.removeAllListeners('log-message');
        ipcRenderer.on('log-message', (_event, value) => callback(value));
    }
});
