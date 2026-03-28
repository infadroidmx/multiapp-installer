const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const LEGACY_CONFIG_FILE = path.join(app.getPath('userData'), 'postiz-config.json');
const APP_CONFIG_FILES = {
    postiz: path.join(app.getPath('userData'), 'postiz-config.json'),
    xui: path.join(app.getPath('userData'), 'xui-config.json'),
    media: path.join(app.getPath('userData'), 'media-config.json')
};

function safeReadJson(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    } catch (err) {
        console.error('Error loading config', err);
    }
    return {};
}

function resolveAppConfigPath(appId) {
    return APP_CONFIG_FILES[appId] || APP_CONFIG_FILES.postiz;
}

function registerConfigHandlers(ipcMain) {
    ipcMain.handle('load-config', () => {
        return safeReadJson(LEGACY_CONFIG_FILE);
    });

    ipcMain.handle('save-config', (event, data) => {
        try {
            fs.writeFileSync(LEGACY_CONFIG_FILE, JSON.stringify(data, null, 2));
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('load-app-config', (event, appId) => {
        const configPath = resolveAppConfigPath(appId);
        const appConfig = safeReadJson(configPath);

        if (Object.keys(appConfig).length > 0) {
            return appConfig;
        }

        // Backward compatibility: if legacy file exists and app is postiz,
        // use it as initial source so existing users keep their settings.
        if (appId === 'postiz') {
            return safeReadJson(LEGACY_CONFIG_FILE);
        }

        return {};
    });

    ipcMain.handle('save-app-config', (event, appId, data) => {
        try {
            const configPath = resolveAppConfigPath(appId);
            fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    });
}

module.exports = { registerConfigHandlers };
