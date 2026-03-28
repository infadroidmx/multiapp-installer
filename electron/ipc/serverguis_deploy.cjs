const { NodeSSH } = require('node-ssh');
const { logToUI } = require('../utils/logger.cjs');
const { collectServerHealth, connectToServer } = require('./server_health.cjs');

function registerServerGuisHandlers(ipcMain) {
    ipcMain.handle('scan-serverguis', async (event, config) => {
        const ssh = new NodeSSH();
        try {
            await connectToServer(ssh, config);
            const serverHealth = await collectServerHealth(ssh);

            const scanScript = `#!/bin/bash
export DEBIAN_FRONTEND=noninteractive
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS="$ID"
else
    # Fallbacks if /etc/os-release is missing
    if [ -f /etc/redhat-release ]; then
        if grep -qi "centos" /etc/redhat-release; then OS="centos";
        elif grep -qi "fedora" /etc/redhat-release; then OS="fedora";
        elif grep -qi "almalinux" /etc/redhat-release; then OS="almalinux";
        elif grep -qi "rocky" /etc/redhat-release; then OS="rocky";
        else OS="unknown"; fi
    elif command -v lsb_release >/dev/null 2>&1; then
        OS=$(lsb_release -is | tr '[:upper:]' '[:lower:]')
    else
        OS="unknown"
    fi
fi

# Try to detect installed Desktop Environment/Window Manager
INSTALLED_GUI=""
GUI_STATE="inactive"

# Check standard display managers
if pgrep -x "gdm3" > /dev/null || systemctl is-active --quiet gdm3 2>/dev/null || systemctl is-active --quiet gdm.service 2>/dev/null; then
    INSTALLED_GUI="gnome"
    GUI_STATE="active"
elif pgrep -x "lightdm" > /dev/null || systemctl is-active --quiet lightdm 2>/dev/null; then
    # LightDM could be used by XFCE, MATE, LXDE, Cinnamon, etc.
    # Try to distinguish based on specific session processes or installed packages
    if dpkg -l | grep -q xfce4-session 2>/dev/null || rpm -qa | grep -q xfce4-session 2>/dev/null; then
        INSTALLED_GUI="xfce"
    elif dpkg -l | grep -q mate-session-manager 2>/dev/null || rpm -qa | grep -q mate-desktop 2>/dev/null; then
        INSTALLED_GUI="mate"
    elif dpkg -l | grep -q lxde-core 2>/dev/null || rpm -qa | grep -q lxde 2>/dev/null; then
        INSTALLED_GUI="lxde"
    elif dpkg -l | grep -q cinnamon 2>/dev/null || rpm -qa | grep -q cinnamon 2>/dev/null; then
        INSTALLED_GUI="cinnamon"
    else
        INSTALLED_GUI="unknown_lightdm"
    fi
    GUI_STATE="active"
elif pgrep -x "sddm" > /dev/null || systemctl is-active --quiet sddm 2>/dev/null; then
    INSTALLED_GUI="kde"
    GUI_STATE="active"
elif dpkg -l | grep -q ubuntu-desktop 2>/dev/null; then
     INSTALLED_GUI="gnome"
     GUI_STATE="installed_stopped"
elif dpkg -l | grep -q xfce4 2>/dev/null; then
     INSTALLED_GUI="xfce"
     GUI_STATE="installed_stopped"
elif dpkg -l | grep -q kde-plasma-desktop 2>/dev/null || dpkg -l | grep -q plasma-desktop 2>/dev/null; then
     INSTALLED_GUI="kde"
     GUI_STATE="installed_stopped"
fi

if [ -z "$INSTALLED_GUI" ]; then
    INSTALLED_GUI="none"
fi

echo "OS|||$OS"
echo "GUI|||$INSTALLED_GUI|||$GUI_STATE"
`;

            const encoded = Buffer.from(scanScript).toString('base64');
            const result = await ssh.execCommand(`echo '${encoded}' | base64 -d | bash`);
            ssh.dispose();

            let detectedOS = 'unknown';
            let installedGui = 'none';
            let guiState = 'inactive';

            for (const line of (result.stdout || '').split('\n')) {
                const trimmed = line.trim();
                if (trimmed.startsWith('OS|||')) {
                    detectedOS = trimmed.split('|||')[1] || 'unknown';
                } else if (trimmed.startsWith('GUI|||')) {
                    const parts = trimmed.split('|||');
                    installedGui = parts[1] || 'none';
                    guiState = parts[2] || 'inactive';
                }
            }

            return {
                success: true,
                detectedOS,
                installedGui,
                guiState,
                serverHealth
            };

        } catch (err) {
            try { ssh.dispose(); } catch (_e) {}
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('deploy-serverguis', async (event, config, mode = 'deploy', selectedGui = null, installScript = null) => {
        const ssh = new NodeSSH();
        try {
            await connectToServer(ssh, config);
            logToUI('Connected securely via SSH.');

            const runRemoteScript = async (script, scriptName) => {
                const encodedScript = Buffer.from(script).toString('base64');
                return ssh.execCommand(
                  `echo '${encodedScript}' | base64 -d > /tmp/${scriptName} && chmod +x /tmp/${scriptName} && bash /tmp/${scriptName}`,
                  {
                    onStdout(chunk) {
                      chunk.toString('utf8').split('\\n').forEach((line) => {
                        if (line.trim()) logToUI(line.trimRight());
                      });
                    },
                    onStderr(chunk) {
                      chunk.toString('utf8').split('\\n').forEach((line) => {
                        if (line.trim()) logToUI(`WARN: ${line.trimRight()}`);
                      });
                    }
                  }
                );
            };

            if (mode === 'remove') {
                logToUI('Initiating Server GUI Removal Sequence...');
                const removeScript = `#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive

echo "==> Stopping Display Managers based on OS..."
if command -v systemctl >/dev/null 2>&1; then
    systemctl stop gdm3 lightdm sddm xrdp xrdp-sesman 2>/dev/null || true
    systemctl disable gdm3 lightdm sddm xrdp xrdp-sesman 2>/dev/null || true
fi

if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS="$ID"
else
    # Minimal fallback
    OS="unknown"
    if [ -f /etc/debian_version ]; then OS="debian"; fi
fi

if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    echo "==> Removing GUI packages via apt..."
    apt-get remove --purge -y ubuntu-desktop ubuntu-gnome-desktop gnome-shell xfce4 xfce4-goodies lightdm gdm3 sddm kde-plasma-desktop plasma-desktop xrdp xorgxrdp >/dev/null 2>&1 || true
    apt-get autoremove -y >/dev/null 2>&1
elif [ "$OS" = "fedora" ] || [ "$OS" = "centos" ] || [ "$OS" = "rocky" ] || [ "$OS" = "almalinux" ]; then
    echo "==> Removing GUI packages via dnf/yum..."
    # Note: Package names might vary slightly, this handles common groups/packages
    if command -v dnf >/dev/null 2>&1; then
        dnf groupremove -y "Server with GUI" "Xfce Desktop" "KDE Plasma Workspaces" "GNOME Desktop Environment" >/dev/null 2>&1 || true
        dnf remove -y lightdm gdm sddm xrdp >/dev/null 2>&1 || true
    elif command -v yum >/dev/null 2>&1; then
         yum groupremove -y "Server with GUI" "Xfce Desktop" "KDE Plasma Workspaces" "GNOME Desktop Environment" >/dev/null 2>&1 || true
         yum remove -y lightdm gdm sddm xrdp >/dev/null 2>&1 || true
    fi
elif [ "$OS" = "arch" ]; then
    echo "==> Removing GUI packages via pacman..."
    pacman -Rnsc --noconfirm gnome xfce4 xfce4-goodies plasma-meta sddm lightdm gdm xrdp >/dev/null 2>&1 || true
fi

echo "==> Setting default boot target to multi-user (headless CLI)..."
if command -v systemctl >/dev/null 2>&1; then
    systemctl set-default multi-user.target
fi

echo "==> GUI Removal Complete. The server is now headless."
`;
                
                const removeResult = await runRemoteScript(removeScript, 'remove_servergui.sh');
                if (removeResult.code !== 0) {
                    throw new Error(removeResult.stderr || `GUI removal failed with exit code ${removeResult.code}`);
                }
                logToUI('GUI successfully removed. The system is reverted to headless operation.');
                ssh.dispose();
                return { success: true };
            } // end mode === 'remove'


            // Mode === 'deploy'
            if (!installScript) {
                 throw new Error("Install script not provided.");
            }

            logToUI(`Initiating GUI Installation Script (${selectedGui})...`);
            const deployResult = await runRemoteScript(installScript, 'install_servergui.sh');

            if (deployResult.code !== 0) {
                 // The scripts provided by the user often reboot the machine at the very end.
                 // If the SSH connection is severed by a reboot, node-ssh might throw an error or return code != 0.
                 // We will loosely handle errors unless they explicitly happen early.
                 logToUI(`WARN: Script returned code ${deployResult.code}. This may be expected if the server is rebooting as part of the script.`);
            }

            logToUI('GUI Deployment task finished.');
            ssh.dispose();
            return { success: true };

        } catch (err) {
            logToUI(`ERROR: ${err.message}`);
            try { ssh.dispose(); } catch (_e) {}
            return { success: false, error: err.message };
        }
    });
}

module.exports = { registerServerGuisHandlers };
