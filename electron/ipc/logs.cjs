const { NodeSSH } = require('node-ssh');
const { logToUI } = require('../utils/logger.cjs');

function registerLogsHandlers(ipcMain) {
    ipcMain.handle('fetch-logs', async (event, config) => {
        const ssh = new NodeSSH();
        try {
            logToUI('🔍 Fetching live container logs...');
            await ssh.connect({
                host: config.serverHost,
                username: config.serverUser,
                password: config.serverPassword,
                readyTimeout: 10000
            });
            await ssh.execCommand('docker logs postiz --tail 100 2>&1', {
                onStdout(chunk) {
                    chunk.toString('utf8').split('\n').forEach(line => { if (line.trim()) logToUI(line.trimRight()); });
                },
                onStderr(chunk) {
                    chunk.toString('utf8').split('\n').forEach(line => { if (line.trim()) logToUI('ERR: ' + line.trimRight()); });
                }
            });
            logToUI('✅ End of container logs.');
            ssh.dispose();
            return { success: true };
        } catch (err) {
            logToUI('❌ SSH Error: ' + err.message);
            ssh.dispose();
            return { success: false, error: err.message };
        }
    });
}

module.exports = { registerLogsHandlers };
