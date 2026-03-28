const { NodeSSH } = require('node-ssh');
const { logToUI } = require('../utils/logger.cjs');
const { collectServerHealth, connectToServer } = require('./server_health.cjs');

function registerDeployHandlers(ipcMain) {
    ipcMain.handle('deploy-server', async (event, config, mode = 'update') => {
        const ssh = new NodeSSH();
        try {
            logToUI('Connecting to server ' + config.serverHost + '...');
            await connectToServer(ssh, config);
            logToUI('Connected securely via SSH.');

            const runRemoteScript = async (script, scriptName) => {
                const encodedScript = Buffer.from(script).toString('base64');
                return ssh.execCommand(`echo '${encodedScript}' | base64 -d > /tmp/${scriptName} && chmod +x /tmp/${scriptName} && bash /tmp/${scriptName}`, {
                    onStdout(chunk) {
                        const lines = chunk.toString('utf8').split('\n');
                        lines.forEach(line => {
                            if (line.trim()) logToUI(line.trimRight());
                        });
                    },
                    onStderr(chunk) {
                        const lines = chunk.toString('utf8').split('\n');
                        lines.forEach(line => {
                            if (line.trim()) logToUI('WARN: ' + line.trimRight());
                        });
                    }
                });
            };

            const cloudflareCleanupScript = `#!/bin/bash
set -e
echo "==> Removing Cloudflare Tunnel service..."
if command -v systemctl >/dev/null 2>&1; then
  systemctl stop cloudflared 2>/dev/null || true
  systemctl disable cloudflared 2>/dev/null || true
fi
if command -v cloudflared >/dev/null 2>&1; then
  cloudflared service uninstall 2>/dev/null || true
fi
rm -f /etc/systemd/system/cloudflared.service
rm -f /etc/systemd/system/multi-user.target.wants/cloudflared.service
systemctl daemon-reload 2>/dev/null || true
echo "Cloudflare Tunnel removed (if it was installed)."
`;

            if (mode === 'remove-tunnel') {
                const removeTunnelResult = await runRemoteScript(cloudflareCleanupScript, 'postiz_remove_tunnel.sh');
                if (removeTunnelResult.code !== 0) {
                    throw new Error(removeTunnelResult.stderr || `Cloudflare tunnel removal failed with exit code ${removeTunnelResult.code}`);
                }
                logToUI('Cloudflare tunnel removal complete.');
                ssh.dispose();
                return { success: true };
            }

            if (mode === 'remove') {
                const removeStackScript = `#!/bin/bash
set -e
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  COMPOSE_CMD=""
fi

echo "==> Removing Postiz stack..."
if [ -n "$COMPOSE_CMD" ] && [ -d /root/postiz-docker-compose ]; then
  cd /root/postiz-docker-compose
  $COMPOSE_CMD down --remove-orphans --volumes 2>/dev/null || true
fi

for svc in postiz postiz-postgres postiz-redis temporal temporal-postgresql temporal-elasticsearch temporal-ui temporal-admin-tools spotlight; do
  docker rm -f "$svc" 2>/dev/null || true
done

systemctl stop postiz-compose-bootstrap.service 2>/dev/null || true
systemctl disable postiz-compose-bootstrap.service 2>/dev/null || true
rm -f /etc/systemd/system/postiz-compose-bootstrap.service
rm -f /usr/local/bin/postiz-compose-bootstrap.sh
systemctl daemon-reload 2>/dev/null || true

rm -rf /root/postiz-docker-compose
echo "Postiz stack removed."
`;
                const removeStackResult = await runRemoteScript(removeStackScript, 'postiz_remove_stack.sh');
                if (removeStackResult.code !== 0) {
                    throw new Error(removeStackResult.stderr || `Postiz removal failed with exit code ${removeStackResult.code}`);
                }
                logToUI('Postiz removal complete.');
                ssh.dispose();
                return { success: true };
            }

            const addEnv = (key, val, defaultVal = null, quote = true) => {
                let v = val;
                if (v === undefined || v === null || v.toString().trim() === "") {
                    v = defaultVal;
                }
                if (v !== null && v !== "") {
                    return quote ? `\n      ${key}: '${v}'` : `\n      ${key}: ${v}`;
                }
                return "";
            };

            const postizPort = config.POSTIZ_PORT || '4007';
            const configuredMainUrl = (config.MAIN_URL || '').toString().trim();
            const defaultMainUrl = configuredMainUrl || `http://localhost:${postizPort}`;
            const defaultBackendUrl = `${defaultMainUrl}/api`;
            const temporalCorsOrigins = [
                defaultMainUrl,
                'http://localhost:3000',
              'http://127.0.0.1:3000',
              '*'
            ].join(',');

            const composeYaml = `
services:
  postiz:
    image: ${config.POSTIZ_IMAGE || 'ghcr.io/gitroomhq/postiz-app:latest'}
    container_name: postiz
    restart: always
    environment:
      # === Required Settings
      DATABASE_URL: 'postgresql://postiz-user:postiz-password@postiz-postgres:5432/postiz-db-local'
      REDIS_URL: 'redis://postiz-redis:6379'
      BACKEND_INTERNAL_URL: 'http://localhost:3000'
      TEMPORAL_ADDRESS: "temporal:7233"`
                + addEnv('MAIN_URL', config.MAIN_URL, defaultMainUrl)
                + addEnv('FRONTEND_URL', config.FRONTEND_URL, defaultMainUrl)
                + addEnv('NEXT_PUBLIC_BACKEND_URL', config.NEXT_PUBLIC_BACKEND_URL, defaultBackendUrl)
                + addEnv('JWT_SECRET', config.JWT_SECRET, "your-randomly-generated-local-secret-key-12345")
                + addEnv('IS_GENERAL', config.IS_GENERAL, "false")
                + addEnv('DISABLE_REGISTRATION', config.DISABLE_REGISTRATION, "false")
                + addEnv('RUN_CRON', config.RUN_CRON, "true")
                + addEnv('STORAGE_PROVIDER', config.STORAGE_PROVIDER, "local")
                + addEnv('UPLOAD_DIRECTORY', config.UPLOAD_DIRECTORY, "/uploads")
                + addEnv('NEXT_PUBLIC_UPLOAD_DIRECTORY', config.NEXT_PUBLIC_UPLOAD_DIRECTORY, "/uploads")
                + addEnv('CLOUDFLARE_ACCOUNT_ID', config.CLOUDFLARE_ACCOUNT_ID)
                + addEnv('CLOUDFLARE_ACCESS_KEY', config.CLOUDFLARE_ACCESS_KEY)
                + addEnv('CLOUDFLARE_SECRET_ACCESS_KEY', config.CLOUDFLARE_SECRET_ACCESS_KEY)
                + addEnv('CLOUDFLARE_BUCKETNAME', config.CLOUDFLARE_BUCKETNAME)
                + addEnv('CLOUDFLARE_BUCKET_URL', config.CLOUDFLARE_BUCKET_URL)
                + addEnv('CLOUDFLARE_REGION', config.CLOUDFLARE_REGION)
                + addEnv('X_API_KEY', config.X_API_KEY)
                + addEnv('X_API_SECRET', config.X_API_SECRET)
                + addEnv('LINKEDIN_CLIENT_ID', config.LINKEDIN_CLIENT_ID)
                + addEnv('LINKEDIN_CLIENT_SECRET', config.LINKEDIN_CLIENT_SECRET)
                + addEnv('REDDIT_CLIENT_ID', config.REDDIT_CLIENT_ID)
                + addEnv('REDDIT_CLIENT_SECRET', config.REDDIT_CLIENT_SECRET)
                + addEnv('GITHUB_CLIENT_ID', config.GITHUB_CLIENT_ID)
                + addEnv('GITHUB_CLIENT_SECRET', config.GITHUB_CLIENT_SECRET)
                + addEnv('BEEHIIVE_API_KEY', config.BEEHIIVE_API_KEY)
                + addEnv('BEEHIIVE_PUBLICATION_ID', config.BEEHIIVE_PUBLICATION_ID)
                + addEnv('THREADS_APP_ID', config.THREADS_APP_ID)
                + addEnv('THREADS_APP_SECRET', config.THREADS_APP_SECRET)
                + addEnv('FACEBOOK_APP_ID', config.FACEBOOK_APP_ID)
                + addEnv('FACEBOOK_APP_SECRET', config.FACEBOOK_APP_SECRET)
                + addEnv('YOUTUBE_CLIENT_ID', config.YOUTUBE_CLIENT_ID)
                + addEnv('YOUTUBE_CLIENT_SECRET', config.YOUTUBE_CLIENT_SECRET)
                + addEnv('TIKTOK_CLIENT_ID', config.TIKTOK_CLIENT_ID)
                + addEnv('TIKTOK_CLIENT_SECRET', config.TIKTOK_CLIENT_SECRET)
                + addEnv('PINTEREST_CLIENT_ID', config.PINTEREST_CLIENT_ID)
                + addEnv('PINTEREST_CLIENT_SECRET', config.PINTEREST_CLIENT_SECRET)
                + addEnv('DRIBBBLE_CLIENT_ID', config.DRIBBBLE_CLIENT_ID)
                + addEnv('DRIBBBLE_CLIENT_SECRET', config.DRIBBBLE_CLIENT_SECRET)
                + addEnv('DISCORD_CLIENT_ID', config.DISCORD_CLIENT_ID)
                + addEnv('DISCORD_CLIENT_SECRET', config.DISCORD_CLIENT_SECRET)
                + addEnv('DISCORD_BOT_TOKEN_ID', config.DISCORD_BOT_TOKEN_ID)
                + addEnv('SLACK_ID', config.SLACK_ID)
                + addEnv('SLACK_SECRET', config.SLACK_SECRET)
                + addEnv('SLACK_SIGNING_SECRET', config.SLACK_SIGNING_SECRET)
                + addEnv('MASTODON_URL', config.MASTODON_URL, "https://mastodon.social")
                + addEnv('MASTODON_CLIENT_ID', config.MASTODON_CLIENT_ID)
                + addEnv('MASTODON_CLIENT_SECRET', config.MASTODON_CLIENT_SECRET)
                + addEnv('NEXT_PUBLIC_POSTIZ_OAUTH_DISPLAY_NAME', config.NEXT_PUBLIC_POSTIZ_OAUTH_DISPLAY_NAME)
                + addEnv('NEXT_PUBLIC_POSTIZ_OAUTH_LOGO_URL', config.NEXT_PUBLIC_POSTIZ_OAUTH_LOGO_URL)
                + addEnv('POSTIZ_GENERIC_OAUTH', config.POSTIZ_GENERIC_OAUTH)
                + addEnv('POSTIZ_OAUTH_URL', config.POSTIZ_OAUTH_URL)
                + addEnv('POSTIZ_OAUTH_AUTH_URL', config.POSTIZ_OAUTH_AUTH_URL)
                + addEnv('POSTIZ_OAUTH_TOKEN_URL', config.POSTIZ_OAUTH_TOKEN_URL)
                + addEnv('POSTIZ_OAUTH_USERINFO_URL', config.POSTIZ_OAUTH_USERINFO_URL)
                + addEnv('POSTIZ_OAUTH_CLIENT_ID', config.POSTIZ_OAUTH_CLIENT_ID)
                + addEnv('POSTIZ_OAUTH_CLIENT_SECRET', config.POSTIZ_OAUTH_CLIENT_SECRET)
                + addEnv('POSTIZ_OAUTH_SCOPE', config.POSTIZ_OAUTH_SCOPE)
                + addEnv('NEXT_PUBLIC_SENTRY_DSN', config.NEXT_PUBLIC_SENTRY_DSN)
                + addEnv('SENTRY_SPOTLIGHT', config.SENTRY_SPOTLIGHT)
                + addEnv('OPENAI_API_KEY', config.OPENAI_API_KEY)
                + addEnv('NEXT_PUBLIC_DISCORD_SUPPORT', config.NEXT_PUBLIC_DISCORD_SUPPORT)
                + addEnv('NEXT_PUBLIC_POLOTNO', config.NEXT_PUBLIC_POLOTNO)
                + addEnv('API_LIMIT', config.API_LIMIT, 30, false)
                + addEnv('FEE_AMOUNT', config.FEE_AMOUNT, 0.05, false)
                + addEnv('STRIPE_PUBLISHABLE_KEY', config.STRIPE_PUBLISHABLE_KEY)
                + addEnv('STRIPE_SECRET_KEY', config.STRIPE_SECRET_KEY)
                + addEnv('STRIPE_SIGNING_KEY', config.STRIPE_SIGNING_KEY)
                + addEnv('STRIPE_SIGNING_KEY_CONNECT', config.STRIPE_SIGNING_KEY_CONNECT)
                + addEnv('NX_ADD_PLUGINS', config.NX_ADD_PLUGINS)
                + addEnv('DUB_TOKEN', config.DUB_TOKEN)
                + addEnv('DUB_API_ENDPOINT', config.DUB_API_ENDPOINT)
                + addEnv('DUB_SHORT_LINK_DOMAIN', config.DUB_SHORT_LINK_DOMAIN)
                + addEnv('SHORT_IO_SECRET_KEY', config.SHORT_IO_SECRET_KEY)
                + addEnv('KUTT_API_KEY', config.KUTT_API_KEY)
                + addEnv('KUTT_API_ENDPOINT', config.KUTT_API_ENDPOINT)
                + addEnv('KUTT_SHORT_LINK_DOMAIN', config.KUTT_SHORT_LINK_DOMAIN)
                + addEnv('LINK_DRIP_API_KEY', config.LINK_DRIP_API_KEY)
                + addEnv('LINK_DRIP_API_ENDPOINT', config.LINK_DRIP_API_ENDPOINT)
                + addEnv('LINK_DRIP_SHORT_LINK_DOMAIN', config.LINK_DRIP_SHORT_LINK_DOMAIN) + `

    volumes:
      - postiz-config:/config/
      - postiz-uploads:/uploads/
    ports:
      - "${postizPort}:5000"
    networks:
      - postiz-network
      - temporal-network
    depends_on:
      postiz-postgres:
        condition: service_healthy
      postiz-redis:
        condition: service_healthy
      temporal:
        condition: service_healthy

  postiz-postgres:
    image: postgres:17-alpine
    container_name: postiz-postgres
    restart: always
    environment:
      POSTGRES_PASSWORD: postiz-password
      POSTGRES_USER: postiz-user
      POSTGRES_DB: postiz-db-local
    volumes:
      - postgres-volume:/var/lib/postgresql/data
    networks:
      - postiz-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postiz-user -d postiz-db-local"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
  
  postiz-redis:
    image: redis:7.2
    container_name: postiz-redis
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    volumes:
      - postiz-redis-data:/data
    networks:
      - postiz-network

  # For Application Monitoring / Debugging
  spotlight:
    pull_policy: always
    container_name: spotlight
    ports:
      - 8969:8969/tcp
    image: ghcr.io/getsentry/spotlight:latest
    networks:
      - postiz-network

  # -----------------------
  # Temporal Stack
  # -----------------------
  temporal-elasticsearch:
    container_name: temporal-elasticsearch
    image: elasticsearch:7.17.27
    environment:
      - cluster.routing.allocation.disk.threshold_enabled=true
      - cluster.routing.allocation.disk.watermark.low=512mb
      - cluster.routing.allocation.disk.watermark.high=256mb
      - cluster.routing.allocation.disk.watermark.flood_stage=128mb
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms256m -Xmx256m
      - xpack.security.enabled=false
    networks:
      - temporal-network
    expose:
      - 9200
    volumes:
      - /var/lib/elasticsearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:9200/_cluster/health?wait_for_status=yellow&timeout=5s || exit 1"]
      interval: 20s
      timeout: 10s
      retries: 10
      start_period: 90s

  temporal-postgresql:
    container_name: temporal-postgresql
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: temporal
      POSTGRES_USER: temporal
    networks:
      - temporal-network
    expose:
      - 5432
    volumes:
      - /var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U temporal"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  temporal:
    container_name: temporal
    ports:
      - '7233:7233'
    image: temporalio/auto-setup:1.28.1
    healthcheck:
      test: ["CMD-SHELL", "grep -q ':1C41 ' /proc/net/tcp || grep -q ':1C41 ' /proc/net/tcp6"]
      interval: 15s
      timeout: 10s
      retries: 20
      start_period: 90s
    depends_on:
      temporal-postgresql:
        condition: service_healthy
      temporal-elasticsearch:
        condition: service_healthy
    environment:
      - DB=postgres12
      - DB_PORT=5432
      - POSTGRES_USER=temporal
      - POSTGRES_PWD=temporal
      - POSTGRES_SEEDS=temporal-postgresql
      - DYNAMIC_CONFIG_FILE_PATH=config/dynamicconfig/development-sql.yaml
      - ENABLE_ES=true
      - ES_SEEDS=temporal-elasticsearch
      - ES_VERSION=v7
      - TEMPORAL_NAMESPACE=default
    networks:
      - temporal-network
    volumes:
      - ./dynamicconfig:/etc/temporal/config/dynamicconfig
    labels:
      kompose.volume.type: configMap

  temporal-admin-tools:
    container_name: temporal-admin-tools
    image: temporalio/admin-tools:1.28.1-tctl-1.18.4-cli-1.4.1
    environment:
      - TEMPORAL_ADDRESS=temporal:7233
      - TEMPORAL_CLI_ADDRESS=temporal:7233
    networks:
      - temporal-network
    stdin_open: true
    depends_on:
      - temporal
    tty: true

  temporal-ui:
    container_name: temporal-ui
    image: temporalio/ui:2.34.0
    environment:
      - TEMPORAL_ADDRESS=temporal:7233
      - TEMPORAL_CORS_ORIGINS=${temporalCorsOrigins}
    networks:
      - temporal-network
    ports:
      - '8080:8080'

volumes:
  postgres-volume:
    external: false
  postiz-redis-data:
    external: false
  postiz-config:
    external: false
  postiz-uploads:
    external: false

networks:
  postiz-network:
    external: false
  temporal-network:
    driver: bridge
    name: temporal-network
`;

            // Write docker compose to temp remote
            const encodedYaml = Buffer.from(composeYaml).toString('base64');

            let bashScript = `#!/bin/bash\nset -e\n`;

            if (mode === 'full') {
                bashScript += `echo "==> [1/6] Waiting for apt locks & Running system updates..."\nwhile fuser /var/lib/dpkg/lock >/dev/null 2>&1 || fuser /var/lib/apt/lists/lock >/dev/null 2>&1; do sleep 2; done; apt-get update >/dev/null || true\n`;
            }

            if (mode === 'full' || mode === 'update') {
              bashScript += `echo "==> [2/6] Ensuring Docker Compose v2 is available..."\nexport DEBIAN_FRONTEND=noninteractive\nif ! docker compose version >/dev/null 2>&1; then\n    while fuser /var/lib/dpkg/lock >/dev/null 2>&1 || fuser /var/lib/apt/lists/lock >/dev/null 2>&1; do sleep 2; done\n\n    # Repair malformed docker apt source files from previous failed runs.
        if [ -f /etc/apt/sources.list.d/docker.list ] && ! grep -Eq '^deb \\[arch=[^ ]+ signed-by=[^ ]+\\] https://download\\.docker\\.com/linux/ubuntu [^ ]+ stable$' /etc/apt/sources.list.d/docker.list; then\n        rm -f /etc/apt/sources.list.d/docker.list\n    fi\n\n    apt-get update >/dev/null || true\n    apt-get install -y ca-certificates curl gnupg lsb-release >/dev/null || true\n\n    install -m 0755 -d /etc/apt/keyrings\n    if [ ! -f /etc/apt/keyrings/docker.gpg ]; then\n        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes\n    fi\n    chmod a+r /etc/apt/keyrings/docker.gpg\n\n    ARCH=\"$(dpkg --print-architecture)\"\n    CODENAME=\"$(. /etc/os-release && echo \"$VERSION_CODENAME\")\"\n    echo "deb [arch=$ARCH signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $CODENAME stable" > /etc/apt/sources.list.d/docker.list\n\n    apt-get update >/dev/null\n    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin >/dev/null\nfi\n\nif docker compose version >/dev/null 2>&1; then\n    COMPOSE_CMD=\"docker compose\"\nelif command -v docker-compose >/dev/null 2>&1; then\n    COMPOSE_CMD=\"docker-compose\"\nelse\n    echo \"ERROR: Docker Compose not found (neither 'docker compose' nor 'docker-compose').\"\n    exit 1\nfi\necho \"    -> Using compose command: $COMPOSE_CMD\"\n`;
            }

            if (mode === 'full' || mode === 'update') {
                bashScript += `echo "==> [3/6] Setting up project directory..."\nmkdir -p /root/postiz-docker-compose/dynamicconfig\ncd /root/postiz-docker-compose\n`;
                bashScript += `echo "==> [4/6] Updating docker-compose.yml with your keys..."\necho "${encodedYaml}" | base64 -d > docker-compose.yml\n`;
                bashScript += `echo "    -> Writing Temporal dynamic config..."\ncat > /root/postiz-docker-compose/dynamicconfig/development-sql.yaml << 'DYNAMICCONFIG'\nsystem.forceSearchAttributesCacheRefreshOnRead:\n  - value: true\n    constraints: {}\nDYNAMICCONFIG\n`;
            }

            if (mode === 'full' || mode === 'update' || mode === 'tunnel') {
                bashScript += `echo "==> [5/6] Configuring Cloudflare Tunnel..."\nCLOUDFLARE_TOKEN="${config.CLOUDFLARE_TOKEN || ""}"\nif [ "$CLOUDFLARE_TOKEN" != "" ] && [ "$CLOUDFLARE_TOKEN" != "your_cloudflare_tunnel_token_here" ]; then\n    if ! command -v cloudflared &> /dev/null; then\n        echo "    -> Downloading cloudflared..."\n        curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb\n        dpkg -i cloudflared.deb || apt-get install -f -y\n        rm cloudflared.deb\n    fi\n    echo "    -> Re-installing service with new token..."\n    cloudflared service uninstall 2>/dev/null || true\n    cloudflared service install "$CLOUDFLARE_TOKEN" 2>/dev/null || true\n    systemctl restart cloudflared\n    echo "    -> Cloudflare tunnel restarted."\nelse\n    echo "    -> Tunnel token empty. Skipping."\nfi\n`;
            }

            if (mode === 'full' || mode === 'update') {
              bashScript += `echo "==> [6/7] Installing startup health-wait bootstrap service..."\ncat > /usr/local/bin/postiz-compose-bootstrap.sh << 'BOOTSTRAP'\n#!/bin/bash\nset -e\ncd /root/postiz-docker-compose\n\nif docker compose version >/dev/null 2>&1; then\n  COMPOSE_CMD=\"docker compose\"\nelif command -v docker-compose >/dev/null 2>&1; then\n  COMPOSE_CMD=\"docker-compose\"\nelse\n  echo \"ERROR: Docker Compose not found (neither 'docker compose' nor 'docker-compose').\"\n  exit 1\nfi\n\n$COMPOSE_CMD up -d\n$COMPOSE_CMD up -d --wait --wait-timeout 600 postiz postiz-postgres postiz-redis temporal temporal-postgresql temporal-elasticsearch temporal-admin-tools spotlight\n\nif ! $COMPOSE_CMD ps temporal-ui 2>/dev/null | grep -q \"Up\"; then\n  echo \"WARN: temporal-ui is not running. Core deployment is healthy; Temporal UI is optional.\"\nfi\n\n$COMPOSE_CMD ps\nBOOTSTRAP\nchmod +x /usr/local/bin/postiz-compose-bootstrap.sh\n\ncat > /etc/systemd/system/postiz-compose-bootstrap.service << 'SERVICE'\n[Unit]\nDescription=Postiz Compose Bootstrap With Health Wait\nRequires=docker.service\nAfter=docker.service network-online.target\nWants=network-online.target\n\n[Service]\nType=oneshot\nExecStart=/usr/local/bin/postiz-compose-bootstrap.sh\nTimeoutStartSec=900\n\n[Install]\nWantedBy=multi-user.target\nSERVICE\n\nsystemctl daemon-reload\nsystemctl enable postiz-compose-bootstrap.service >/dev/null 2>&1 || true\n`;

              bashScript += `echo "==> [7/7] Starting Docker containers with health waits..."\ncd /root/postiz-docker-compose\n$COMPOSE_CMD down 2>/dev/null || true\nsystemctl restart postiz-compose-bootstrap.service\n`;
            }
            const result = await runRemoteScript(bashScript, 'postiz_update.sh');

                if (result.code !== 0) {
                  throw new Error(result.stderr || `Remote deployment script failed with exit code ${result.code}`);
                }

            logToUI("Deployment Complete! Your settings have been applied.");

            ssh.dispose();
            return { success: true };
        } catch (err) {
            logToUI('ERROR: ' + err.message);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('scan-postiz-server', async (_event, config) => {
      const ssh = new NodeSSH();
      try {
        await connectToServer(ssh, config);
        const serverHealth = await collectServerHealth(ssh, {
          configuredPort: parseInt((config.POSTIZ_PORT || '4007').toString(), 10) || 4007
        });

        const scanScript = `#!/bin/bash
  SERVICES="postiz postiz-postgres postiz-redis temporal temporal-postgresql temporal-elasticsearch temporal-ui spotlight"
  if ! command -v docker >/dev/null 2>&1; then
    echo "NO_DOCKER"
    exit 0
  fi
  for svc in $SERVICES; do
    STATUS=$(docker inspect --format='{{.State.Status}}' "$svc" 2>/dev/null || echo "not_found")
    PORT=$(docker port "$svc" 2>/dev/null | awk -F: '{print $NF}' | head -1 || echo "")
    IMAGE=$(docker inspect --format='{{.Config.Image}}' "$svc" 2>/dev/null || echo "")
    echo "SVC|||$svc|||$STATUS|||$PORT|||$IMAGE"
  done
  docker ps -a --format '{{.Names}}|||{{.State}}|||{{.Image}}' | while IFS='|||' read -r NAME STATE IMAGE; do
    if [ -n "$NAME" ]; then
      PORT=$(docker port "$NAME" 2>/dev/null | awk -F: '{print $NF}' | head -1 || echo "")
      echo "ALL|||$NAME|||$STATE|||$PORT|||$IMAGE"
    fi
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
        const allContainers = [];
        let cloudflareStatus = 'inactive';

        for (const line of (result.stdout || '').split('\n')) {
          const trimmed = line.trim();
          if (trimmed.startsWith('SVC|||')) {
            const parts = trimmed.split('|||');
            const name = parts[1] || '';
            const status = parts[2] || 'not_found';
            const portRaw = parts[3] ? parseInt(parts[3].trim(), 10) : null;
            const image = parts[4] || '';
            if (name) {
              containers[name] = {
                status,
                port: portRaw && !isNaN(portRaw) ? portRaw : null,
                image
              };
            }
          } else if (trimmed.startsWith('ALL|||')) {
            const parts = trimmed.split('|||');
            const name = (parts[1] || '').trim();
            const status = (parts[2] || 'unknown').trim();
            const portRaw = parts[3] ? parseInt(parts[3].trim(), 10) : null;
            const image = (parts[4] || '').trim();
            if (name) {
              allContainers.push({
                name,
                status,
                port: portRaw && !isNaN(portRaw) ? portRaw : null,
                image
              });
            }
          } else if (trimmed.startsWith('CF|||')) {
            cloudflareStatus = trimmed.split('|||')[1] || 'inactive';
          }
        }

        const findFallback = (serviceName) => {
          const normalized = serviceName.toLowerCase();
          return allContainers.find((container) => {
            const n = (container.name || '').toLowerCase();
            if (!n) return false;

            if (normalized === 'postiz') {
              return n.includes('postiz') && !n.includes('postgres') && !n.includes('redis');
            }
            if (normalized === 'postiz-postgres') {
              return n.includes('postiz') && (n.includes('postgres') || n.includes('pg'));
            }
            if (normalized === 'postiz-redis') {
              return n.includes('postiz') && n.includes('redis');
            }
            if (normalized === 'temporal') {
              return n === 'temporal' || (n.includes('temporal') && !n.includes('ui') && !n.includes('postgres') && !n.includes('elastic') && !n.includes('admin'));
            }
            if (normalized === 'temporal-postgresql') {
              return n.includes('temporal') && (n.includes('postgres') || n.includes('pg'));
            }
            if (normalized === 'temporal-elasticsearch') {
              return n.includes('temporal') && n.includes('elastic');
            }
            if (normalized === 'temporal-ui') {
              return n.includes('temporal') && n.includes('ui');
            }
            if (normalized === 'spotlight') {
              return n.includes('spotlight');
            }
            return false;
          });
        };

        Object.keys(containers).forEach((serviceName) => {
          if (containers[serviceName].status !== 'not_found') {
            return;
          }
          const fallback = findFallback(serviceName);
          if (!fallback) {
            return;
          }
          containers[serviceName] = {
            status: fallback.status || 'unknown',
            port: fallback.port || null,
            image: fallback.image || containers[serviceName].image || ''
          };
        });

        let composeFile = '';
        try {
            const catResult = await ssh.execCommand('cat /root/postiz-docker-compose/docker-compose.yml 2>/dev/null || echo ""');
            composeFile = catResult.stdout || '';
        } catch (e) { }

        const remoteEnv = {};
        if (composeFile) {
            const lines = composeFile.split('\n');
            for (const line of lines) {
                const match = line.match(/^\s+([A-Z0-9_]+):\s*['"]?(.*?)['"]?\s*$/);
                if (match) {
                    remoteEnv[match[1]] = match[2];
                }
            }
        }

        return { success: true, dockerInstalled: true, containers, cloudflareStatus, serverHealth, remoteEnv };
      } catch (err) {
        try { ssh.dispose(); } catch (_e) {}
        return { success: false, error: err.message };
      }
    });
}

module.exports = { registerDeployHandlers };
