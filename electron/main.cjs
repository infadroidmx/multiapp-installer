const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { NodeSSH } = require('node-ssh');

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

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist-electron/index.html'));
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

// IPC Handlers
const CONFIG_FILE = path.join(app.getPath('userData'), 'postiz-config.json');

ipcMain.handle('load-config', () => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading config', err);
  }
  return {};
});

ipcMain.handle('save-config', (event, data) => {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

function logToUI(msg) {
  if (mainWindow) {
    mainWindow.webContents.send('log-message', msg);
  }
}

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


ipcMain.handle('create-user', async (event, config, name, email, password) => {
  const ssh = new NodeSSH();
  try {
    logToUI(`👤 Creating user account for ${email}...`);
    await ssh.connect({
      host: config.serverHost,
      username: config.serverUser,
      password: config.serverPassword,
      readyTimeout: 10000
    });

    // 1. Get bcrypt hash from the container using a simple one-liner
    logToUI(`🔐 Generating secure password hash...`);
    // We use single quotes for the node script to prevent local expansion
    // and we catch the output carefully.
    const hashCmd = `docker exec postiz node -e "console.log(require('bcrypt').hashSync('${password.replace(/'/g, "'\\''")}', 10))"`;
    const hashResult = await ssh.execCommand(hashCmd);
    const hash = hashResult.stdout.trim();

    if (!hash || !hash.startsWith('$')) {
      throw new Error('Failed to generate valid bcrypt hash: ' + (hashResult.stderr || hashResult.stdout));
    }

    // 2. Prepare SQL transaction for User, Organization, and UserOrganization
    const sqlEscape = (str) => str.replace(/'/g, "''");
    const escapedName = sqlEscape(name);
    const escapedOrgName = sqlEscape(`${name}'s Workspace`);

    const userId = crypto.randomUUID();
    const orgId = crypto.randomUUID();
    const userOrgId = crypto.randomUUID();

    // We prepare the SQL carefully
    const sql = `
BEGIN;
-- Delete if exists to allow retry
DELETE FROM "UserOrganization" WHERE "userId" IN (SELECT id FROM "User" WHERE email = '${email}');
DELETE FROM "User" WHERE email = '${email}';

INSERT INTO "User" (id, email, password, "providerName", name, timezone, "isSuperAdmin", "activated", "createdAt", "updatedAt") 
VALUES ('${userId}', '${email}', '${hash}', 'LOCAL', '${escapedName}', 0, true, true, NOW(), NOW());

INSERT INTO "Organization" (id, name, "createdAt", "updatedAt") 
VALUES ('${orgId}', '${escapedOrgName}', NOW(), NOW());

INSERT INTO "UserOrganization" (id, "userId", "organizationId", role, "createdAt", "updatedAt") 
VALUES ('${userOrgId}', '${userId}', '${orgId}', 'SUPERADMIN', NOW(), NOW());
COMMIT;
    `.trim();

    logToUI(`🗄️ Executing database transaction...`);
    // To avoid ANY shell mangling of $ or quotes, we base64 the SQL
    const encodedSql = Buffer.from(sql).toString('base64');
    const sqlCmd = `echo "${encodedSql}" | base64 -d > /tmp/create_user.sql && docker cp /tmp/create_user.sql postiz-postgres:/tmp/create_user.sql && docker exec postiz-postgres psql -U postiz-user -d postiz-db-local -f /tmp/create_user.sql && rm /tmp/create_user.sql`;

    const result = await ssh.execCommand(sqlCmd);

    if (result.stdout && result.stdout.includes('COMMIT')) {
      logToUI('✅ SUCCESS: Account created for ' + email);
      logToUI(`🎉 Done! ${name} can now log in at ${(config.MAIN_URL || '').replace(/\/+$/, '')}/auth`);
    } else {
      throw new Error(result.stderr || result.stdout || 'SQL transaction failed');
    }

    ssh.dispose();
    return { success: true };
  } catch (err) {
    logToUI('❌ Error: ' + err.message);
    ssh.dispose();
    return { success: false, error: err.message };
  }
});

ipcMain.handle('deploy-server', async (event, config, mode = 'update') => {
  const ssh = new NodeSSH();
  try {
    logToUI('Connecting to server ' + config.serverHost + '...');
    await ssh.connect({
      host: config.serverHost,
      username: config.serverUser,
      password: config.serverPassword,
      // allow self-signed / auto-accept
      readyTimeout: 10000
    });
    logToUI('Connected securely via SSH.');

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

    const composeYaml = `
services:
  postiz:
    image: ghcr.io/gitroomhq/postiz-app:latest
    container_name: postiz
    restart: always
    environment:
      # === Required Settings
      DATABASE_URL: 'postgresql://postiz-user:postiz-password@postiz-postgres:5432/postiz-db-local'
      REDIS_URL: 'redis://postiz-redis:6379'
      BACKEND_INTERNAL_URL: 'http://localhost:3000'
      TEMPORAL_ADDRESS: "temporal:7233"`
      + addEnv('MAIN_URL', config.MAIN_URL, "http://localhost:4007")
      + addEnv('FRONTEND_URL', config.FRONTEND_URL, "http://localhost:4007")
      + addEnv('NEXT_PUBLIC_BACKEND_URL', config.NEXT_PUBLIC_BACKEND_URL, "http://localhost:4007/api")
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
      - "${config.POSTIZ_PORT || '4007'}:5000"
    networks:
      - postiz-network
      - temporal-network
    depends_on:
      postiz-postgres:
        condition: service_healthy
      postiz-redis:
        condition: service_healthy
      temporal:
        condition: service_started

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
      test: pg_isready -U postiz-user -d postiz-db-local
      interval: 10s
      timeout: 3s
      retries: 3
  
  postiz-redis:
    image: redis:7.2
    container_name: postiz-redis
    restart: always
    healthcheck:
      test: redis-cli ping
      interval: 10s
      timeout: 3s
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

  temporal:
    container_name: temporal
    ports:
      - '7233:7233'
    image: temporalio/auto-setup:1.28.1
    depends_on:
      - temporal-postgresql
      - temporal-elasticsearch
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
      - TEMPORAL_CORS_ORIGINS=http://127.0.0.1:3000
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
      bashScript += `echo "==> [2/6] Ensuring docker & docker-compose are installed..."\nwhile fuser /var/lib/dpkg/lock >/dev/null 2>&1 || fuser /var/lib/apt/lists/lock >/dev/null 2>&1; do sleep 2; done; apt-get install -y docker.io docker-compose >/dev/null || true\n`;
    }

    if (mode === 'full' || mode === 'update') {
      bashScript += `echo "==> [3/6] Setting up project directory..."\nmkdir -p /root/postiz-docker-compose/dynamicconfig\ncd /root/postiz-docker-compose\n`;
      bashScript += `echo "==> [4/6] Updating docker-compose.yml with your keys..."\necho "${encodedYaml}" | base64 -d > docker-compose.yml\n`;
      bashScript += `echo "    -> Writing Temporal dynamic config..."\ncat > /root/postiz-docker-compose/dynamicconfig/development-sql.yaml << 'DYNAMICCONFIG'\nsystem.forceSearchAttributesCacheRefreshOnRead:\n  - value: true\n    constraints: {}\nDYNAMICCONFIG\n`;
    }

    if (mode === 'full' || mode === 'tunnel') {
      bashScript += `echo "==> [5/6] Configuring Cloudflare Tunnel..."\nCLOUDFLARE_TOKEN="${config.CLOUDFLARE_TOKEN || ""}"\nif [ "$CLOUDFLARE_TOKEN" != "" ] && [ "$CLOUDFLARE_TOKEN" != "your_cloudflare_tunnel_token_here" ]; then\n    if ! command -v cloudflared &> /dev/null; then\n        echo "    -> Downloading cloudflared..."\n        curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb\n        dpkg -i cloudflared.deb || apt-get install -f -y\n        rm cloudflared.deb\n    fi\n    echo "    -> Re-installing service with new token..."\n    cloudflared service uninstall 2>/dev/null || true\n    cloudflared service install "$CLOUDFLARE_TOKEN" 2>/dev/null || true\n    systemctl restart cloudflared\n    echo "    -> Cloudflare tunnel restarted."\nelse\n    echo "    -> Tunnel token empty. Skipping."\nfi\n`;
    }

    if (mode === 'full' || mode === 'update') {
      bashScript += `echo "==> [6/6] Starting Docker containers (Requires 5-10 minutes on fresh VMs)..."\ncd /root/postiz-docker-compose\ndocker-compose down 2>/dev/null || true\ndocker-compose up -d\necho "    -> Waiting 60s for Temporal to fully initialize before starting Postiz..."\nsleep 60\ndocker restart postiz\necho "    -> Docker containers initialized! Checking status..."\ndocker ps\n`;
    }
    const encodedBash = Buffer.from(bashScript).toString('base64');

    await ssh.execCommand(`echo '${encodedBash}' | base64 -d > /tmp/postiz_update.sh && chmod +x /tmp/postiz_update.sh && bash /tmp/postiz_update.sh`, {
      onStdout(chunk) {
        const lines = chunk.toString('utf8').split('\n');
        lines.forEach(line => {
          if (line.trim()) logToUI(line.trimRight());
        });
      },
      onStderr(chunk) {
        const lines = chunk.toString('utf8').split('\n');
        lines.forEach(line => {
          if (line.trim()) logToUI("WARN: " + line.trimRight());
        });
      }
    });

    logToUI("Deployment Complete! Your settings have been applied.");

    ssh.dispose();
    return { success: true };
  } catch (err) {
    logToUI('ERROR: ' + err.message);
    return { success: false, error: err.message };
  }
});
