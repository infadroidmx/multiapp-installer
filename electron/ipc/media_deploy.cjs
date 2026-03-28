const { NodeSSH } = require('node-ssh');
const { logToUI } = require('../utils/logger.cjs');
const { collectServerHealth, connectToServer } = require('./server_health.cjs');

const DEFAULT_PORTS = {
    portainer: 9000,
    sabnzbd: 8080,
    deluge: 8112,
    jackett: 9117,
    flaresolverr: 8191,
    radarr: 7878,
    sonarr: 8989,
    profilarr: 6868,
    requesterr: 4545
};

const DEFAULT_SERVICES = {
    portainer: true,
    sabnzbd: true,
    deluge: true,
    jackett: true,
    flaresolverr: true,
    radarr: true,
    sonarr: true,
    profilarr: true,
    requesterr: true,
    watchtower: true
};

function toPort(value, fallback) {
    const parsed = parseInt(String(value ?? ''), 10);
    if (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) {
        return parsed;
    }
    return fallback;
}

function boolValue(value, fallback) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }
    return fallback;
}

function buildDependsOn(list, enabled) {
    const active = list.filter((name) => enabled[name]);
    if (!active.length) return '';
    return `\n    depends_on:${active.map((name) => `\n      - ${name}`).join('')}`;
}

function registerMediaHandlers(ipcMain) {
  ipcMain.handle('deploy-media', async (event, config, mode = 'deploy') => {
        const ssh = new NodeSSH();
        try {
            const serverHost = (config.serverHost || '').toString().trim();

            logToUI(`Connecting to server ${serverHost}...`);
        await connectToServer(ssh, config);
            logToUI('Connected securely via SSH.');

            const ports = {
                portainer: toPort(config?.mediaPorts?.portainer, DEFAULT_PORTS.portainer),
                sabnzbd: toPort(config?.mediaPorts?.sabnzbd, DEFAULT_PORTS.sabnzbd),
                deluge: toPort(config?.mediaPorts?.deluge, DEFAULT_PORTS.deluge),
                jackett: toPort(config?.mediaPorts?.jackett, DEFAULT_PORTS.jackett),
                flaresolverr: toPort(config?.mediaPorts?.flaresolverr, DEFAULT_PORTS.flaresolverr),
                radarr: toPort(config?.mediaPorts?.radarr, DEFAULT_PORTS.radarr),
                sonarr: toPort(config?.mediaPorts?.sonarr, DEFAULT_PORTS.sonarr),
                profilarr: toPort(config?.mediaPorts?.profilarr, DEFAULT_PORTS.profilarr),
                requesterr: toPort(config?.mediaPorts?.requesterr, DEFAULT_PORTS.requesterr)
            };

            const enabled = {
                portainer: boolValue(config?.mediaServices?.portainer, DEFAULT_SERVICES.portainer),
                sabnzbd: boolValue(config?.mediaServices?.sabnzbd, DEFAULT_SERVICES.sabnzbd),
                deluge: boolValue(config?.mediaServices?.deluge, DEFAULT_SERVICES.deluge),
                jackett: boolValue(config?.mediaServices?.jackett, DEFAULT_SERVICES.jackett),
                flaresolverr: boolValue(config?.mediaServices?.flaresolverr, DEFAULT_SERVICES.flaresolverr),
                radarr: boolValue(config?.mediaServices?.radarr, DEFAULT_SERVICES.radarr),
                sonarr: boolValue(config?.mediaServices?.sonarr, DEFAULT_SERVICES.sonarr),
                profilarr: boolValue(config?.mediaServices?.profilarr, DEFAULT_SERVICES.profilarr),
                requesterr: boolValue(config?.mediaServices?.requesterr, DEFAULT_SERVICES.requesterr),
                watchtower: boolValue(config?.mediaServices?.watchtower, DEFAULT_SERVICES.watchtower)
            };

            if (mode === 'deploy' && !Object.values(enabled).some(Boolean)) {
                throw new Error('At least one media service must be enabled.');
            }

            const cfEnabled = !!(config.cloudflareEnabled && config.cloudflareToken);
            const cfToken = (config.cloudflareToken || '').toString().trim();
            const runRemoteScript = async (script, scriptName) => {
              const encodedScript = Buffer.from(script).toString('base64');
              return ssh.execCommand(
                `echo '${encodedScript}' | base64 -d > /tmp/${scriptName} && chmod +x /tmp/${scriptName} && bash /tmp/${scriptName}`,
                {
                  onStdout(chunk) {
                    chunk.toString('utf8').split('\n').forEach((line) => {
                      if (line.trim()) logToUI(line.trimRight());
                    });
                  },
                  onStderr(chunk) {
                    chunk.toString('utf8').split('\n').forEach((line) => {
                      if (line.trim()) logToUI(`WARN: ${line.trimRight()}`);
                    });
                  }
                }
              );
            };

            if (mode === 'remove-tunnel') {
              const removeTunnelScript = `#!/bin/bash
      set -e
      echo "==> Removing Cloudflare Tunnel service..."
      systemctl stop cloudflared 2>/dev/null || true
      systemctl disable cloudflared 2>/dev/null || true
      if command -v cloudflared >/dev/null 2>&1; then
        cloudflared service uninstall 2>/dev/null || true
      fi
      rm -f /etc/systemd/system/cloudflared.service
      rm -f /etc/systemd/system/multi-user.target.wants/cloudflared.service
      systemctl daemon-reload 2>/dev/null || true
      echo "Cloudflare Tunnel removed (if it was installed)."
      `;
              const removeTunnelResult = await runRemoteScript(removeTunnelScript, 'media_remove_tunnel.sh');
              if (removeTunnelResult.code !== 0) {
                throw new Error(removeTunnelResult.stderr || `Cloudflare tunnel removal failed with exit code ${removeTunnelResult.code}`);
              }
              ssh.dispose();
              return { success: true };
            }

            // Build per-service port availability check bash lines
            const portCheckLines = Object.entries(ports)
                .filter(([name]) => enabled[name] && ports[name])
                .map(([name, port]) => [
                    `  if ss -tlnp 2>/dev/null | awk '{print $4}' | grep -qE ":${port}$"; then`,
                    `    echo "WARN: Port ${port} (${name}) is already in use - check for conflicts."`,
                    `  else`,
                    `    echo "  Port ${port} (${name}): Available"`,
                    `  fi`
                ].join('\n'))
                .join('\n');

            const cfDeployBlock = cfEnabled ? `
echo ""
echo "==> Installing Cloudflare Tunnel..."
ARCH=$(dpkg --print-architecture 2>/dev/null || uname -m)
if ! command -v cloudflared >/dev/null 2>&1; then
  if [ "$ARCH" = "amd64" ] || [ "$ARCH" = "x86_64" ]; then
    CF_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
  elif [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    CF_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
  else
    CF_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
  fi
  curl -fsSL --output /usr/local/bin/cloudflared "$CF_URL"
  chmod +x /usr/local/bin/cloudflared
  echo "  cloudflared binary installed."
fi
cloudflared service uninstall 2>/dev/null || true
cloudflared service install '${cfToken}'
systemctl enable --now cloudflared 2>/dev/null || true
echo "Cloudflare Tunnel installed and active."
echo "  -> Configure hostnames at: https://one.dash.cloudflare.com -> Zero Trust -> Networks -> Tunnels"
` : '';

            const timezone = (config.mediaTimezone || 'UTC').toString().trim();
            const puid = (config.mediaPuid || '1000').toString().trim();
            const pgid = (config.mediaPgid || '1000').toString().trim();
            const stackDir = (config.mediaStackDir || '/root/media-stack').toString().trim();

            if (mode === 'remove-all') {
                const removeAllScript = `#!/bin/bash
set -e
STACK_DIR="${stackDir}"
echo "==> Removing Media stack from $STACK_DIR..."

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  COMPOSE_CMD=""
fi

if [ -n "$COMPOSE_CMD" ] && [ -f "$STACK_DIR/docker-compose.yml" ]; then
  cd "$STACK_DIR"
  $COMPOSE_CMD down --remove-orphans --volumes 2>/dev/null || true
fi

for svc in portainer sabnzbd deluge jackett flaresolverr radarr sonarr profilarr requesterr watchtower; do
  docker rm -f "$svc" 2>/dev/null || true
done

rm -rf "$STACK_DIR"
echo "Media stack removed."
`;
                const removeAllResult = await runRemoteScript(removeAllScript, 'media_remove_all.sh');
                if (removeAllResult.code !== 0) {
                    throw new Error(removeAllResult.stderr || `Media removal failed with exit code ${removeAllResult.code}`);
                }
                ssh.dispose();
                return { success: true };
            }

            const composeSections = [];

            if (enabled.portainer) {
                composeSections.push(`
  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    restart: unless-stopped
    command: -H unix:///var/run/docker.sock
    ports:
      - "${ports.portainer}:9000"
      - "9443:9443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./portainer_data:/data`);
            }

            if (enabled.sabnzbd) {
                composeSections.push(`
  sabnzbd:
    image: linuxserver/sabnzbd:latest
    container_name: sabnzbd
    restart: unless-stopped
    environment:
      - PUID=${puid}
      - PGID=${pgid}
      - TZ=${timezone}
    ports:
      - "${ports.sabnzbd}:8080"
      - "9090:9090"
    volumes:
      - ./config/sabnzbd:/config
      - ./downloads:/downloads
      - ./incomplete:/incomplete`);
            }

            if (enabled.deluge) {
                composeSections.push(`
  deluge:
    image: linuxserver/deluge:latest
    container_name: deluge
    restart: unless-stopped
    environment:
      - PUID=${puid}
      - PGID=${pgid}
      - TZ=${timezone}
    ports:
      - "${ports.deluge}:8112"
      - "6881:6881"
      - "6881:6881/udp"
    volumes:
      - ./config/deluge:/config
      - ./downloads:/downloads`);
            }

            if (enabled.jackett) {
                composeSections.push(`
  jackett:
    image: linuxserver/jackett:latest
    container_name: jackett
    restart: unless-stopped
    environment:
      - PUID=${puid}
      - PGID=${pgid}
      - TZ=${timezone}
    ports:
      - "${ports.jackett}:9117"
    volumes:
      - ./config/jackett:/config
      - ./downloads:/downloads`);
            }

            if (enabled.flaresolverr) {
                composeSections.push(`
  flaresolverr:
    image: flaresolverr/flaresolverr:latest
    container_name: flaresolverr
    restart: unless-stopped
    environment:
      - LOG_LEVEL=info
      - TZ=${timezone}
    ports:
      - "${ports.flaresolverr}:8191"`);
            }

            if (enabled.radarr) {
                composeSections.push(`
  radarr:
    image: linuxserver/radarr:latest
    container_name: radarr
    restart: unless-stopped
    environment:
      - PUID=${puid}
      - PGID=${pgid}
      - TZ=${timezone}
    ports:
      - "${ports.radarr}:7878"
    volumes:
      - ./config/radarr:/config
      - ./downloads:/downloads
      - ./media/movies:/movies${buildDependsOn(['jackett', 'sabnzbd', 'deluge'], enabled)}`);
            }

            if (enabled.sonarr) {
                composeSections.push(`
  sonarr:
    image: linuxserver/sonarr:latest
    container_name: sonarr
    restart: unless-stopped
    environment:
      - PUID=${puid}
      - PGID=${pgid}
      - TZ=${timezone}
    ports:
      - "${ports.sonarr}:8989"
    volumes:
      - ./config/sonarr:/config
      - ./downloads:/downloads
      - ./media/tv:/tv${buildDependsOn(['jackett', 'sabnzbd', 'deluge'], enabled)}`);
            }

            if (enabled.profilarr) {
                composeSections.push(`
  profilarr:
    image: santiagosayshey/profilarr:latest
    container_name: profilarr
    restart: unless-stopped
    environment:
      - TZ=${timezone}
    ports:
      - "${ports.profilarr}:6868"
    volumes:
      - ./config/profilarr:/config${buildDependsOn(['sonarr', 'radarr'], enabled)}`);
            }

            if (enabled.requesterr) {
                composeSections.push(`
  requesterr:
    image: thomst08/requestrr:latest
    container_name: requesterr
    restart: unless-stopped
    environment:
      - TZ=${timezone}
    ports:
      - "${ports.requesterr}:4545"
    volumes:
      - ./config/requesterr:/root/config${buildDependsOn(['sonarr', 'radarr'], enabled)}`);
            }

            if (enabled.watchtower) {
                composeSections.push(`
  watchtower:
    image: containrrr/watchtower:latest
    container_name: watchtower
    restart: unless-stopped
    command: --cleanup --schedule "0 0 4 * * *"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock`);
            }

            const composeYaml = `services:${composeSections.join('')}
`;

            const summaryRows = [
                ['Portainer', enabled.portainer, ports.portainer],
                ['SABnzbd', enabled.sabnzbd, ports.sabnzbd],
                ['Deluge', enabled.deluge, ports.deluge],
                ['Jackett', enabled.jackett, ports.jackett],
                ['Flaresolverr', enabled.flaresolverr, ports.flaresolverr],
                ['Radarr', enabled.radarr, ports.radarr],
                ['Sonarr', enabled.sonarr, ports.sonarr],
                ['Profilarr', enabled.profilarr, ports.profilarr],
                ['Requesterr', enabled.requesterr, ports.requesterr]
            ];

            const summaryText = summaryRows
                .filter(([, isEnabled]) => isEnabled)
                .map(([name, , port]) => `${name}: http://${serverHost}:${port}`)
                .join('\\n');

            const encodedYaml = Buffer.from(composeYaml).toString('base64');

            const bashScript = `#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive

STACK_DIR="${stackDir}"
SAB_ENABLED="${enabled.sabnzbd ? '1' : '0'}"

echo "==> [Pre-Check] Checking port availability..."
${portCheckLines}

echo "==> [1/6] Detecting OS..."
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS="$ID"
else
  echo "ERROR: Cannot detect OS."
  exit 1
fi

if [ "$OS" != "ubuntu" ] && [ "$OS" != "debian" ]; then
  echo "ERROR: Unsupported OS: $OS"
  exit 1
fi

echo "==> [2/6] Ensuring Docker + Compose v2..."
if ! docker compose version >/dev/null 2>&1; then
  while fuser /var/lib/dpkg/lock >/dev/null 2>&1 || fuser /var/lib/apt/lists/lock >/dev/null 2>&1; do sleep 2; done

  if [ -f /etc/apt/sources.list.d/docker.list ] && ! grep -Eq '^deb \[arch=[^ ]+ signed-by=[^ ]+\] https://download\.docker\.com/linux/(ubuntu|debian) [^ ]+ stable$' /etc/apt/sources.list.d/docker.list; then
    rm -f /etc/apt/sources.list.d/docker.list
  fi

  apt-get update -y >/dev/null
  apt-get install -y ca-certificates curl gnupg lsb-release >/dev/null

  install -m 0755 -d /etc/apt/keyrings
  if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
    curl -fsSL "https://download.docker.com/linux/$OS/gpg" | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
  fi
  chmod a+r /etc/apt/keyrings/docker.gpg

  ARCH="$(dpkg --print-architecture)"
  CODENAME="$(. /etc/os-release && echo "$VERSION_CODENAME")"
  echo "deb [arch=$ARCH signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS $CODENAME stable" > /etc/apt/sources.list.d/docker.list

  apt-get update -y >/dev/null
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin >/dev/null
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "ERROR: Docker Compose not found."
  exit 1
fi
systemctl enable --now docker >/dev/null 2>&1 || true

echo "==> [3/6] Preparing stack directories..."
mkdir -p "$STACK_DIR/config/radarr" "$STACK_DIR/config/sonarr" "$STACK_DIR/config/sabnzbd" "$STACK_DIR/config/deluge" "$STACK_DIR/config/jackett" "$STACK_DIR/config/requesterr" "$STACK_DIR/config/profilarr"
mkdir -p "$STACK_DIR/downloads" "$STACK_DIR/incomplete" "$STACK_DIR/media/movies" "$STACK_DIR/media/tv" "$STACK_DIR/portainer_data"
cd "$STACK_DIR"

echo "==> [4/6] Writing docker-compose.yml..."
echo "${encodedYaml}" | base64 -d > docker-compose.yml

echo "==> [5/6] Pulling and starting containers..."
$COMPOSE_CMD pull
$COMPOSE_CMD up -d --remove-orphans

if [ "$SAB_ENABLED" = "1" ]; then
  echo "==> [5.5/6] Applying SABnzbd external access setting..."
  SAB_CONFIG_PATH="$STACK_DIR/config/sabnzbd/sabnzbd.ini"
  for i in {1..30}; do
    if [ -f "$SAB_CONFIG_PATH" ]; then
      break
    fi
    sleep 2
  done

  if [ -f "$SAB_CONFIG_PATH" ]; then
    if grep -q '^inet_exposure' "$SAB_CONFIG_PATH"; then
      sed -i 's/^inet_exposure *= *.*/inet_exposure = 5/' "$SAB_CONFIG_PATH"
    else
      echo 'inet_exposure = 5' >> "$SAB_CONFIG_PATH"
    fi
    docker restart sabnzbd >/dev/null || true
  else
    echo "WARN: SABnzbd config file not found after wait; skipping inet_exposure update."
  fi
fi

echo "==> [6/6] Final status"
$COMPOSE_CMD ps

${cfDeployBlock}
echo ""
echo "Media Stack Installed Successfully"
echo "${summaryText}"
`;

            const result = await runRemoteScript(bashScript, 'media_stack_install.sh');

            if (result.code !== 0) {
                throw new Error(result.stderr || `Media deployment failed with exit code ${result.code}`);
            }

            logToUI('Media Stack deployment completed successfully.');
            ssh.dispose();
            return { success: true };
        } catch (err) {
            logToUI(`ERROR: ${err.message}`);
            try { ssh.dispose(); } catch (_e) {}
            return { success: false, error: err.message };
        }
    });

    // Scan server for installed media services
    ipcMain.handle('scan-media-server', async (event, config) => {
        const ssh = new NodeSSH();
        try {
        await connectToServer(ssh, config);
        const serverHealth = await collectServerHealth(ssh);

            const scanScript = `#!/bin/bash
SERVICES="portainer sabnzbd deluge jackett flaresolverr radarr sonarr profilarr requesterr watchtower"
if ! command -v docker >/dev/null 2>&1; then
  echo "NO_DOCKER"
  exit 0
fi
for svc in $SERVICES; do
  STATUS=$(docker inspect --format='{{.State.Status}}' "$svc" 2>/dev/null || echo "not_found")
  IMAGE=$(docker inspect --format='{{.Config.Image}}' "$svc" 2>/dev/null || echo "")
  PORT=$(docker port "$svc" 2>/dev/null | awk -F: '{print $NF}' | head -1 || echo "")
  COMPOSE_DIR=$(docker inspect --format='{{index .Config.Labels "com.docker.compose.project.working_dir"}}' "$svc" 2>/dev/null || echo "")
  echo "SVC|||$svc|||$STATUS|||$PORT|||$COMPOSE_DIR|||$IMAGE"
done
CF_STATUS=$(systemctl is-active cloudflared 2>/dev/null || echo "inactive")
echo "CF|||$CF_STATUS"
`;
            const encoded = Buffer.from(scanScript).toString('base64');
            const result = await ssh.execCommand(`echo '${encoded}' | base64 -d | bash`);
            ssh.dispose();

            if ((result.stdout || '').includes('NO_DOCKER')) {
                return { success: true, dockerInstalled: false, containers: {}, cloudflareStatus: 'inactive', serverHealth };
            }

            const containers = {};
            let cloudflareStatus = 'inactive';
            for (const line of (result.stdout || '').split('\n')) {
                const trimmed = line.trim();
                if (trimmed.startsWith('SVC|||')) {
                    const parts = trimmed.split('|||');
                    const name = parts[1] || '';
                    const status = parts[2] || 'not_found';
                    const portRaw = parts[3] ? parseInt(parts[3].trim(), 10) : null;
                    const composeDir = parts[4] || '';
                    const image = parts[5] || '';
                    if (name) {
                        containers[name] = {
                            status,
                            port: portRaw && !isNaN(portRaw) ? portRaw : null,
                            composeDir,
                            image
                        };
                    }
                } else if (trimmed.startsWith('CF|||')) {
                    cloudflareStatus = trimmed.split('|||')[1] || 'inactive';
                }
            }

            return { success: true, dockerInstalled: true, containers, cloudflareStatus, serverHealth };
        } catch (err) {
            try { ssh.dispose(); } catch (_e) {}
            return { success: false, error: err.message };
        }
    });
}

module.exports = { registerMediaHandlers };
