const { NodeSSH } = require('node-ssh');

function getServerConnection(config) {
    const serverHost = (config.serverHost || '').toString().trim();
    const serverUser = (config.serverUser || 'root').toString().trim();
    const serverPassword = (config.serverPassword || '').toString();

    if (!serverHost || !serverUser || !serverPassword) {
        throw new Error('Server connection settings are required (host, user, password).');
    }

    return { serverHost, serverUser, serverPassword };
}

async function connectToServer(ssh, config) {
    const { serverHost, serverUser, serverPassword } = getServerConnection(config);
    await ssh.connect({
        host: serverHost,
        username: serverUser,
        password: serverPassword,
        readyTimeout: 10000
    });
    return { serverHost, serverUser };
}

async function collectServerHealth(ssh, options = {}) {
    const configuredPort = Number.isInteger(options.configuredPort) ? options.configuredPort : '';
    const script = `#!/bin/bash
PORT="${configuredPort}"
HOSTNAME_VALUE=$(hostname 2>/dev/null || echo "")
OS_VALUE=$( ( . /etc/os-release 2>/dev/null && echo "$PRETTY_NAME" ) || uname -s )
KERNEL_VALUE=$(uname -r 2>/dev/null || echo "")
UPTIME_VALUE=$(uptime -p 2>/dev/null || uptime 2>/dev/null || echo "")
LOAD_VALUE=$(cut -d' ' -f1-3 /proc/loadavg 2>/dev/null || echo "")
MEM_TOTAL=$(free -m 2>/dev/null | awk '/Mem:/ {print $2}' || echo "")
MEM_USED=$(free -m 2>/dev/null | awk '/Mem:/ {print $3}' || echo "")
DISK_VALUE=$(df -h / 2>/dev/null | awk 'NR==2 {print $3"/"$2" ("$5")"}' || echo "")
LOCAL_IPS=$(hostname -I 2>/dev/null | xargs echo || echo "")
if command -v docker >/dev/null 2>&1; then
  DOCKER_INSTALLED="true"
  DOCKER_STATUS=$(systemctl is-active docker 2>/dev/null || echo "installed")
else
  DOCKER_INSTALLED="false"
  DOCKER_STATUS="not_installed"
fi
CF_STATUS=$(systemctl is-active cloudflared 2>/dev/null || echo "inactive")
PORT_STATUS="not_checked"
if [ -n "$PORT" ]; then
  if ss -tln 2>/dev/null | awk '{print $4}' | grep -qE ":$PORT$"; then
    PORT_STATUS="listening"
  else
    PORT_STATUS="not_listening"
  fi
fi
echo "HEALTH|||hostname|||$HOSTNAME_VALUE"
echo "HEALTH|||os|||$OS_VALUE"
echo "HEALTH|||kernel|||$KERNEL_VALUE"
echo "HEALTH|||uptime|||$UPTIME_VALUE"
echo "HEALTH|||loadAverage|||$LOAD_VALUE"
echo "HEALTH|||memoryUsedMb|||$MEM_USED"
echo "HEALTH|||memoryTotalMb|||$MEM_TOTAL"
echo "HEALTH|||diskUsage|||$DISK_VALUE"
echo "HEALTH|||localIps|||$LOCAL_IPS"
echo "HEALTH|||dockerInstalled|||$DOCKER_INSTALLED"
echo "HEALTH|||dockerStatus|||$DOCKER_STATUS"
echo "HEALTH|||cloudflareStatus|||$CF_STATUS"
echo "HEALTH|||configuredPort|||$PORT"
echo "HEALTH|||configuredPortStatus|||$PORT_STATUS"
`;

    const encoded = Buffer.from(script).toString('base64');
    const result = await ssh.execCommand(`echo '${encoded}' | base64 -d | bash`);
    const parsed = {
        checkedAt: new Date().toISOString(),
        hostname: '',
        os: '',
        kernel: '',
        uptime: '',
        loadAverage: '',
        memoryUsedMb: null,
        memoryTotalMb: null,
        diskUsage: '',
        localIps: [],
        dockerInstalled: false,
        dockerStatus: 'unknown',
        cloudflareStatus: 'inactive',
        configuredPort: Number.isInteger(options.configuredPort) ? options.configuredPort : null,
        configuredPortStatus: 'not_checked'
    };

    for (const line of (result.stdout || '').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('HEALTH|||')) {
            continue;
        }
        const parts = trimmed.split('|||');
        const key = parts[1] || '';
        const value = parts.slice(2).join('|||').trim();
        if (!key) continue;
        switch (key) {
            case 'memoryUsedMb':
            case 'memoryTotalMb': {
                const parsedValue = parseInt(value, 10);
                parsed[key] = Number.isNaN(parsedValue) ? null : parsedValue;
                break;
            }
            case 'dockerInstalled':
                parsed.dockerInstalled = value === 'true';
                break;
            case 'configuredPort': {
                const parsedValue = parseInt(value, 10);
                parsed.configuredPort = Number.isNaN(parsedValue) ? null : parsedValue;
                break;
            }
            case 'localIps':
                parsed.localIps = value ? value.split(/\s+/).filter(Boolean) : [];
                break;
            default:
                parsed[key] = value;
                break;
        }
    }

    parsed.memorySummary = parsed.memoryUsedMb && parsed.memoryTotalMb
        ? `${parsed.memoryUsedMb} MB / ${parsed.memoryTotalMb} MB`
        : 'Unavailable';
    parsed.configuredPortListening = parsed.configuredPortStatus === 'listening';

    return parsed;
}

function registerServerHealthHandlers(ipcMain) {
    ipcMain.handle('test-server-connection', async (_event, config, options = {}) => {
        const ssh = new NodeSSH();
        try {
            const { serverHost, serverUser } = await connectToServer(ssh, config);
            const serverHealth = await collectServerHealth(ssh, options || {});
            ssh.dispose();
            return {
                success: true,
                serverHost,
                serverUser,
                serverHealth
            };
        } catch (err) {
            try { ssh.dispose(); } catch (_disposeErr) {}
            return { success: false, error: err.message };
        }
    });
}

module.exports = {
    getServerConnection,
    connectToServer,
    collectServerHealth,
    registerServerHealthHandlers
};