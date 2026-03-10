<#
.SYNOPSIS
    Automated Postiz Docker Compose Deployer (Clean Version)
.DESCRIPTION
    Creates or updates a Postiz Docker Compose environment on a fresh Ubuntu VM.
    All configuration keys are easily accessible at the top of this script.
    If you add/change keys and run it again, it will automatically update the containers.
#>

$Server = "192.168.1.162"
$Username = "root"
$Password = "password"

# ==============================================================================
# POSTIZ DOCKER COMPOSE CONFIGURATION
# Fill in your keys here. If you run the script again, it will automatically
# update the docker-compose file and restart the containers with these new values.
# ==============================================================================
$Config = @{
    # === Cloudflare Tunnel Settings ===
    # HOW TO GET: Cloudflare Dashboard -> Zero Trust -> Networks -> Tunnels. 
    # Create a tunnel, and copy the token from the install command.
    CLOUDFLARE_TOKEN            = 'eyJhIjoiYjIxYWJlYTA0OTFlYWM5NGY1MjcyNjc1NjkxZjgyYmMiLCJ0IjoiNGQ0NWE0ZmItMDA1MS00NmRkLWEyM2MtMzkzN2Y0MDY0NmQ0IiwicyI6IllUbGlPRGhtTmpVdE5EYzFPQzAwTm1GbExXRTFNamt0WkRkaE9HUXlaREpqTjJJdyJ9'

    # === Core Application Settings ===
    # EXTREMELY IMPORTANT: This is the port your app will run on locally.
    # When you set up your Public Hostname in Cloudflare, you MUST point it to: http://localhost:PORT
    # Default is 4007. If you change this, update your Cloudflare Tunnel Public Hostname!
    POSTIZ_PORT                 = '4007'

    # EXTREMELY IMPORTANT: Your public facing URL (e.g., https://post.huezollc.com)
    # This MUST match the Public Hostname you configure in Cloudflare Zero Trust.
    # Make sure to include https:// and DO NOT include a trailing slash.
    PUBLIC_DOMAIN               = 'https://post.huezollc.com'

    JWT_SECRET                  = 'hdafskjah7e84yhrfoaufsh8fuasd8fha8udfhafsouhsdfo8ud'
    
    # === X (Twitter) API Settings ===
    # HOW TO GET: developer.x.com -> Developer Portal -> Projects & Apps
    # Business/Regular: Create an App, get "API Key and Secret" (Consumer Keys). 
    # Requires Basic or Enterprise tier for posting. Free tier has severe limits.
    X_API_KEY                   = ''
    X_API_SECRET                = ''

    # === LinkedIn API Settings ===
    # HOW TO GET: linkedin.com/developers/apps
    # Business: Create an app, associate it with your LinkedIn Company Page.
    # Regular: Same process, but you might need to create a dummy company page first.
    # Request access to "Share on LinkedIn" and "Sign In with LinkedIn".
    LINKEDIN_CLIENT_ID          = ''
    LINKEDIN_CLIENT_SECRET      = ''

    # === Reddit API Settings ===
    # HOW TO GET: reddit.com/prefs/apps
    # Business/Regular: Click "are you a developer? create an app". Choose "web app".
    # Use your frontend URL + /api/auth/callback/reddit as the redirect URI.
    REDDIT_CLIENT_ID            = ''
    REDDIT_CLIENT_SECRET        = ''

    # === GitHub API Settings ===
    # HOW TO GET: github.com/settings/applications/new
    # Business: Create under your Organization settings.
    # Regular: Create under your Personal Developer settings.
    GITHUB_CLIENT_ID            = ''
    GITHUB_CLIENT_SECRET        = ''

    # === Beehiiv API Settings ===
    # HOW TO GET: app.beehiiv.com/settings/api
    # Business/Regular: Need a paid Beehiiv plan to generate API keys.
    BEEHIIVE_API_KEY            = ''
    BEEHIIVE_PUBLICATION_ID     = ''

    # === Threads API Settings ===
    # HOW TO GET: developers.facebook.com
    # Business/Regular: Create an app. Add the "Threads API" product. You'll need an Instagram account.
    THREADS_APP_ID              = ''
    THREADS_APP_SECRET          = ''

    # === Facebook API Settings ===
    # HOW TO GET: developers.facebook.com
    # Business: Requires Facebook Business Manager verification for public use.
    # Regular: You can use it in "Development Mode" just for your own account without verification.
    FACEBOOK_APP_ID             = '2126188791512821'
    FACEBOOK_APP_SECRET         = '6a12058a2665cba0a8f37ae191a84fc4'

    # === YouTube / Google API Settings ===
    # HOW TO GET: console.cloud.google.com
    # Business/Regular: Create a project, enable YouTube Data API v3. Create OAuth Client ID (Web Application).
    YOUTUBE_CLIENT_ID           = ''
    YOUTUBE_CLIENT_SECRET       = ''

    # === TikTok API Settings ===
    # HOW TO GET: developers.tiktok.com
    # Business/Regular: Need an approved TikTok Developer account.
    TIKTOK_CLIENT_ID            = ''
    TIKTOK_CLIENT_SECRET        = ''

    # === Pinterest API Settings ===
    # HOW TO GET: developers.pinterest.com
    # Business/Regular: Create an app to get your App ID and App secret.
    PINTEREST_CLIENT_ID         = ''
    PINTEREST_CLIENT_SECRET     = ''

    # === Dribbble API Settings ===
    # HOW TO GET: dribbble.com/account/applications/new
    # Business/Regular: Register an application as a developer.
    DRIBBBLE_CLIENT_ID          = ''
    DRIBBBLE_CLIENT_SECRET      = ''

    # === Discord API Settings ===
    # HOW TO GET: discord.com/developers/applications
    # Business/Regular: Create a New Application. Go to OAuth2 to get Client ID/Secret.
    # Go to Bot section to get the Bot Token.
    DISCORD_CLIENT_ID           = ''
    DISCORD_CLIENT_SECRET       = ''
    DISCORD_BOT_TOKEN_ID        = ''

    # === Slack API Settings ===
    # HOW TO GET: api.slack.com/apps
    # Business/Regular: Create New App. Under Basic Information, find App Credentials.
    SLACK_ID                    = ''
    SLACK_SECRET                = ''
    SLACK_SIGNING_SECRET        = ''

    # === Mastodon API Settings ===
    # HOW TO GET: Given the decentralized nature, you create this on your specific instance.
    # Example: mastodon.social/settings/applications. Create a new app there.
    MASTODON_URL                = 'https://mastodon.social'
    MASTODON_CLIENT_ID          = ''
    MASTODON_CLIENT_SECRET      = ''

    # === Misc Settings ===
    # OPENAI: platform.openai.com. Need a funded account to use API.
    OPENAI_API_KEY              = ''
    NEXT_PUBLIC_DISCORD_SUPPORT = ''
    NEXT_PUBLIC_POLOTNO         = ''
    
    # === Payment / Stripe Settings ===
    # HOW TO GET: dashboard.stripe.com/apikeys
    # Business: Essential if charging users. Regular: Not needed if you are the only user.
    STRIPE_PUBLISHABLE_KEY      = ''
    STRIPE_SECRET_KEY           = ''
    STRIPE_SIGNING_KEY          = ''
    STRIPE_SIGNING_KEY_CONNECT  = ''
}
# ==============================================================================
# END OF CONFIGURATION
# ==============================================================================

Import-Module Posh-SSH
$SecurePassword = ConvertTo-SecureString $Password -AsPlainText -Force
$Cred = New-Object System.Management.Automation.PSCredential ($Username, $SecurePassword)

$ComposeYaml = @"
services:
  postiz:
    image: ghcr.io/gitroomhq/postiz-app:latest
    container_name: postiz
    restart: always
    environment:
      # === Required Settings
      MAIN_URL: '$($Config.PUBLIC_DOMAIN)'
      FRONTEND_URL: '$($Config.PUBLIC_DOMAIN)'
      NEXT_PUBLIC_BACKEND_URL: '$($Config.PUBLIC_DOMAIN)/api'
      JWT_SECRET: '$($Config.JWT_SECRET)'
      DATABASE_URL: 'postgresql://postiz-user:postiz-password@postiz-postgres:5432/postiz-db-local'
      REDIS_URL: 'redis://postiz-redis:6379'
      BACKEND_INTERNAL_URL: 'http://localhost:3000'
      TEMPORAL_ADDRESS: "temporal:7233"
      IS_GENERAL: 'true'
      DISABLE_REGISTRATION: 'false'
      RUN_CRON: 'true'

      # === Storage Settings
      STORAGE_PROVIDER: 'local'
      UPLOAD_DIRECTORY: '/uploads'
      NEXT_PUBLIC_UPLOAD_DIRECTORY: '/uploads'

      # === Cloudflare (R2) Settings
      # STORAGE_PROVIDER: 'cloudflare'
      # CLOUDFLARE_ACCOUNT_ID: 'your-account-id'
      # CLOUDFLARE_ACCESS_KEY: 'your-access-key'
      # CLOUDFLARE_SECRET_ACCESS_KEY: 'your-secret-access-key'
      # CLOUDFLARE_BUCKETNAME: 'your-bucket-name'
      # CLOUDFLARE_BUCKET_URL: 'https://your-bucket-url.r2.cloudflarestorage.com/'
      # CLOUDFLARE_REGION: 'auto'

      # === Social Media API Settings
      X_API_KEY: '$($Config.X_API_KEY)'
      X_API_SECRET: '$($Config.X_API_SECRET)'
      LINKEDIN_CLIENT_ID: '$($Config.LINKEDIN_CLIENT_ID)'
      LINKEDIN_CLIENT_SECRET: '$($Config.LINKEDIN_CLIENT_SECRET)'
      REDDIT_CLIENT_ID: '$($Config.REDDIT_CLIENT_ID)'
      REDDIT_CLIENT_SECRET: '$($Config.REDDIT_CLIENT_SECRET)'
      GITHUB_CLIENT_ID: '$($Config.GITHUB_CLIENT_ID)'
      GITHUB_CLIENT_SECRET: '$($Config.GITHUB_CLIENT_SECRET)'
      BEEHIIVE_API_KEY: '$($Config.BEEHIIVE_API_KEY)'
      BEEHIIVE_PUBLICATION_ID: '$($Config.BEEHIIVE_PUBLICATION_ID)'
      THREADS_APP_ID: '$($Config.THREADS_APP_ID)'
      THREADS_APP_SECRET: '$($Config.THREADS_APP_SECRET)'
      FACEBOOK_APP_ID: '$($Config.FACEBOOK_APP_ID)'
      FACEBOOK_APP_SECRET: '$($Config.FACEBOOK_APP_SECRET)'
      YOUTUBE_CLIENT_ID: '$($Config.YOUTUBE_CLIENT_ID)'
      YOUTUBE_CLIENT_SECRET: '$($Config.YOUTUBE_CLIENT_SECRET)'
      TIKTOK_CLIENT_ID: '$($Config.TIKTOK_CLIENT_ID)'
      TIKTOK_CLIENT_SECRET: '$($Config.TIKTOK_CLIENT_SECRET)'
      PINTEREST_CLIENT_ID: '$($Config.PINTEREST_CLIENT_ID)'
      PINTEREST_CLIENT_SECRET: '$($Config.PINTEREST_CLIENT_SECRET)'
      DRIBBBLE_CLIENT_ID: '$($Config.DRIBBBLE_CLIENT_ID)'
      DRIBBBLE_CLIENT_SECRET: '$($Config.DRIBBBLE_CLIENT_SECRET)'
      DISCORD_CLIENT_ID: '$($Config.DISCORD_CLIENT_ID)'
      DISCORD_CLIENT_SECRET: '$($Config.DISCORD_CLIENT_SECRET)'
      DISCORD_BOT_TOKEN_ID: '$($Config.DISCORD_BOT_TOKEN_ID)'
      SLACK_ID: '$($Config.SLACK_ID)'
      SLACK_SECRET: '$($Config.SLACK_SECRET)'
      SLACK_SIGNING_SECRET: '$($Config.SLACK_SIGNING_SECRET)'
      MASTODON_URL: '$($Config.MASTODON_URL)'
      MASTODON_CLIENT_ID: '$($Config.MASTODON_CLIENT_ID)'
      MASTODON_CLIENT_SECRET: '$($Config.MASTODON_CLIENT_SECRET)'

      # === OAuth & Authentik Settings
      # NEXT_PUBLIC_POSTIZ_OAUTH_DISPLAY_NAME: 'Authentik'
      # NEXT_PUBLIC_POSTIZ_OAUTH_LOGO_URL: 'https://raw.githubusercontent.com/walkxcode/dashboard-icons/master/png/authentik.png'
      # POSTIZ_GENERIC_OAUTH: 'false'
      # POSTIZ_OAUTH_URL: 'https://auth.example.com'
      # POSTIZ_OAUTH_AUTH_URL: 'https://auth.example.com/application/o/authorize'
      # POSTIZ_OAUTH_TOKEN_URL: 'https://auth.example.com/application/o/token'
      # POSTIZ_OAUTH_USERINFO_URL: 'https://authentik.example.com/application/o/userinfo'
      # POSTIZ_OAUTH_CLIENT_ID: ''
      # POSTIZ_OAUTH_CLIENT_SECRET: ''
      # POSTIZ_OAUTH_SCOPE: "openid profile email"  # Optional: uncomment to override default scope

      # === Sentry

      # NEXT_PUBLIC_SENTRY_DSN: 'http://spotlight:8969/stream'
      # SENTRY_SPOTLIGHT: '1'

      # === Misc Settings
      OPENAI_API_KEY: '$($Config.OPENAI_API_KEY)'
      NEXT_PUBLIC_DISCORD_SUPPORT: '$($Config.NEXT_PUBLIC_DISCORD_SUPPORT)'
      NEXT_PUBLIC_POLOTNO: '$($Config.NEXT_PUBLIC_POLOTNO)'
      API_LIMIT: 30

      # === Payment / Stripe Settings
      FEE_AMOUNT: 0.05
      STRIPE_PUBLISHABLE_KEY: '$($Config.STRIPE_PUBLISHABLE_KEY)'
      STRIPE_SECRET_KEY: '$($Config.STRIPE_SECRET_KEY)'
      STRIPE_SIGNING_KEY: '$($Config.STRIPE_SIGNING_KEY)'
      STRIPE_SIGNING_KEY_CONNECT: '$($Config.STRIPE_SIGNING_KEY_CONNECT)'

      # === Developer Settings
      NX_ADD_PLUGINS: 

      # === Short Link Service Settings (Optional - leave blank if unused)
      # DUB_TOKEN: ""
      # DUB_API_ENDPOINT: "https://api.dub.co"
      # DUB_SHORT_LINK_DOMAIN: "dub.sh"
      # SHORT_IO_SECRET_KEY: ""
      # KUTT_API_KEY: ""
      # KUTT_API_ENDPOINT: "https://kutt.it/api/v2"
      # KUTT_SHORT_LINK_DOMAIN: "kutt.it"
      # LINK_DRIP_API_KEY: ""
      # LINK_DRIP_API_ENDPOINT: "https://api.linkdrip.com/v1/"
      # LINK_DRIP_SHORT_LINK_DOMAIN: "dripl.ink"

    volumes:
      - postiz-config:/config/
      - postiz-uploads:/uploads/
    ports:
      - "$($Config.POSTIZ_PORT):5000"
    networks:
      - postiz-network
      - temporal-network
    depends_on:
      postiz-postgres:
        condition: service_healthy
      postiz-redis:
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
"@

$EncodedYaml = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes(($ComposeYaml -replace "`r`n", "`n")))

$BashScript = @"
#!/bin/bash
set -e

echo "==> [1/7] Running system updates..."
apt-get update >/dev/null

echo "==> [2/7] Ensuring docker & docker-compose are installed..."
apt-get install -y docker.io docker-compose >/dev/null

echo "==> [3/7] Setting up project directory..."
cd /root
if [ ! -d "postiz-docker-compose" ]; then
    git clone https://github.com/gitroomhq/postiz-docker-compose
fi
cd postiz-docker-compose

echo "==> [4/7] Updating docker-compose.yml with your keys..."
echo "$EncodedYaml" | base64 -d > docker-compose.yml

echo "==> [5/7] Configuring Cloudflare Tunnel..."
CLOUDFLARE_TOKEN="$($Config.CLOUDFLARE_TOKEN)"
if [ "$CLOUDFLARE_TOKEN" != "your_cloudflare_tunnel_token_here" ] && [ -n "$CLOUDFLARE_TOKEN" ]; then
    if ! command -v cloudflared &> /dev/null; then
        echo "    -> Downloading cloudflared..."
        curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        dpkg -i cloudflared.deb || apt-get install -f -y
        rm cloudflared.deb
    fi
    echo "    -> Re-installing service with new token..."
    cloudflared service uninstall 2>/dev/null || true
    cloudflared service install "$CLOUDFLARE_TOKEN" 2>/dev/null || true
    systemctl restart cloudflared
    echo "    -> Cloudflare tunnel restarted. (Starts natively on reboot!)"
else
    echo "    -> CLOUDFLARE_TOKEN not changed from default. Skipping tunnel setup."
fi

echo "==> [6/7] Starting or updating Docker containers (This can take 5-10 minutes on a fresh VM)..."
docker-compose down 2>/dev/null || true
docker-compose up -d
echo "    -> Docker containers started. (Configured with 'restart: always' to start natively on reboot!)"

echo "==> [7/7] Verifying status..."
echo "------------------------------------------------------"
echo "Active Containers:"
docker ps
echo "------------------------------------------------------"
echo "Postiz Logs (last 20 lines):"
docker logs postiz --tail 20
echo "------------------------------------------------------"
echo "✅ Setup Complete. Postiz should be running."
echo "⚠️ IMPORTANT CLOUDFLARE INSTRUCTION:"
echo "   Go to your Cloudflare Zero Trust Dashboard -> Networks -> Tunnels."
echo "   Ensure your Public Hostname points to: http://localhost:$($Config.POSTIZ_PORT)"
echo "------------------------------------------------------"
"@

$EncodedBash = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes(($BashScript -replace "`r`n", "`n")))

Write-Host "Connecting to $Server to execute setup script..."
$Session = New-SSHSession -ComputerName $Server -Credential $Cred -AcceptKey
if ($Session) {
    Write-Host "Deploying Postiz Stack with your configuration in the background..."
    Invoke-SSHCommand -SessionId $Session.SessionId -Command "echo '$EncodedBash' | base64 -d > /tmp/setup_postiz.sh && chmod +x /tmp/setup_postiz.sh && nohup bash /tmp/setup_postiz.sh > /tmp/postiz_install.log 2>&1 &" | Out-Null
    
    Write-Host "Streaming deployment logs..."
    Write-Host "========================================================="
    $lastLineCount = 0
    $isDone = $false
    while (-not $isDone) {
        Start-Sleep -Seconds 5
        $logCheck = Invoke-SSHCommand -SessionId $Session.SessionId -Command "cat /tmp/postiz_install.log 2>/dev/null | wc -l"
        if ([int]$logCheck.Output -gt $lastLineCount) {
            $linesToFetch = [int]$logCheck.Output - $lastLineCount
            $newLogs = Invoke-SSHCommand -SessionId $Session.SessionId -Command "tail -n $linesToFetch /tmp/postiz_install.log"
            if ($newLogs.Output) {
                Write-Host $newLogs.Output -NoNewline
                if ($newLogs.Output -match "Setup Complete" -or $newLogs.Output -match "Postiz should be running") {
                    $isDone = $true
                }
            }
            $lastLineCount = [int]$logCheck.Output
        }
    }
    Write-Host "`n========================================================="
    Remove-SSHSession -SessionId $Session.SessionId
}
else {
    Write-Host "FAIL_CONNECT: Cannot connect to server."
}
