const { NodeSSH } = require('node-ssh');
const { logToUI } = require('../utils/logger.cjs');
const { collectServerHealth, connectToServer } = require('./server_health.cjs');

function registerXuiHandlers(ipcMain) {
    ipcMain.handle('deploy-xui', async (event, config, mode = 'deploy') => {
        const ssh = new NodeSSH();
        try {
            logToUI('Connecting to server ' + config.serverHost + '...');
            await connectToServer(ssh, config);
            logToUI('Connected securely via SSH.');

            const runRemoteScript = async (script, scriptName) => {
                const result = await ssh.execCommand(`cat > /tmp/${scriptName} <<'SCRIPT'\n${script}\nSCRIPT\nchmod +x /tmp/${scriptName}\nbash /tmp/${scriptName}`, {
                    onStdout: (chunk) => logToUI(chunk.toString().trim()),
                    onStderr: (chunk) => logToUI('WARN: ' + chunk.toString().trim())
                });
                return result;
            };

            const cloudflareCleanupScript = `#!/bin/bash
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

            if (mode === 'remove-tunnel') {
                const removeTunnelResult = await runRemoteScript(cloudflareCleanupScript, 'xui_remove_tunnel.sh');
                if (removeTunnelResult.code !== 0) {
                    throw new Error(removeTunnelResult.stderr || `Cloudflare tunnel removal failed with exit code ${removeTunnelResult.code}`);
                }
                ssh.dispose();
                return { success: true };
            }

            if (mode === 'remove') {
                const removeXuiScript = `#!/bin/bash
set -e
echo "==> Removing XUI service and files..."
for svc in xuione xui x-ui; do
  systemctl stop "$svc" 2>/dev/null || true
  systemctl disable "$svc" 2>/dev/null || true
done
rm -f /etc/systemd/system/xuione.service /etc/systemd/system/xui.service /etc/systemd/system/x-ui.service
systemctl daemon-reload 2>/dev/null || true

if command -v mysql >/dev/null 2>&1; then
  mysql -u root -e "DROP DATABASE IF EXISTS xui;" 2>/dev/null || true
  mysql -u root -e "DROP DATABASE IF EXISTS xui_migrate;" 2>/dev/null || true
fi

userdel -r xui 2>/dev/null || true
rm -rf /home/xui /root/XUI_1.5.12.zip /root/install.sh /root/install.python3 /root/build-php.sh /root/license /root/xui.so /root/xui_crack.tar.gz
echo "XUI removed."
`;
                const removeXuiResult = await runRemoteScript(removeXuiScript, 'xui_remove.sh');
                if (removeXuiResult.code !== 0) {
                    throw new Error(removeXuiResult.stderr || `XUI removal failed with exit code ${removeXuiResult.code}`);
                }
                ssh.dispose();
                return { success: true };
            }

            // 0. Cloudflare Tunnel Installer (runs logic from Module 0)
            if (config.cloudflareToken && config.cloudflareToken.trim() !== "") {
                logToUI('Initiating Module 0: Cloudflare Tunnel Gateway...');
                const cfScript = `
if ! command -v cloudflared &> /dev/null; then
    echo "==> Downloading cloudflared..."
    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    dpkg -i cloudflared.deb || apt-get install -f -y
    rm cloudflared.deb
fi
echo "==> Configuring service with token..."
cloudflared service uninstall 2>/dev/null || true
cloudflared service install "${config.cloudflareToken.trim()}" 2>/dev/null || true
systemctl restart cloudflared
echo "==> Cloudflare tunnel active."
`;
                await ssh.execCommand(cfScript, {
                    onStdout: (chunk) => logToUI(chunk.toString().trim()),
                    onStderr: (chunk) => logToUI('CF_WARN: ' + chunk.toString().trim())
                });
            } else {
                logToUI('Module 0: Cloudflare token empty. Skipping tunnel config.');
            }

            // 1. Define the Shell Script (install.sh logic)
            const installSh = `#!/bin/bash
echo -e "\\nChecking that minimal requirements are ok"
if [ -f /etc/lsb-release ]; then
    OS="$(grep DISTRIB_ID /etc/lsb-release | sed 's/^.*=//')"
    VER="$(grep DISTRIB_RELEASE /etc/lsb-release | sed 's/^.*=//')"
elif [ -f /etc/os-release ]; then
    OS="$(grep -w ID /etc/os-release | sed 's/^.*=//')"
    VER="$(grep -w VERSION_ID /etc/os-release | sed 's/^.*=//')"
else
    OS="$(uname -s)"
    VER="$(uname -r)"
fi
ARCH=$(uname -m)
echo "Detected : $OS  $VER  $ARCH"
if [[ "$OS" = "Ubuntu" && ( "$VER" = "18.04" || "$VER" = "20.04" || "$VER" = "22.04" || "$VER" = "24.04" ) && "$ARCH" == "x86_64" ]] ; then
    echo "Ok."
else
    echo "Sorry, this OS is not supported. Use Ubuntu 18.04, 20.04, 22.04 or 24.04."
    exit 1
fi
sudo DEBIAN_FRONTEND=noninteractive apt-get update >/dev/null 2>&1
sudo DEBIAN_FRONTEND=noninteractive apt-get -y install python3 python3-dev unzip wget mariadb-server curl >/dev/null 2>&1
cd /root
wget https://panel.purakura.app/custom/installers/XUI_1.5.12.zip -O XUI_1.5.12.zip >/dev/null 2>&1
unzip -o XUI_1.5.12.zip >/dev/null 2>&1
`;

            // 2. Define the Python Script (install.python3 logic)
            const installPy = `#!/usr/bin/python3
import subprocess, os, random, string, sys, shutil, socket, time, io

rPackages = ["cpufrequtils", "iproute2", "python3", "net-tools", "dirmngr", "gpg-agent", "software-properties-common", "libmaxminddb0", "libmaxminddb-dev", "mmdb-bin", "libcurl4", "libgeoip-dev", "libxslt1-dev", "libonig-dev", "e2fsprogs", "wget", "mariadb-server", "sysstat", "alsa-utils", "v4l-utils", "mcrypt", "certbot", "iptables-persistent", "libjpeg-dev", "libpng-dev", "xz-utils", "zip", "unzip"]
rRemove = ["mysql-server"]
rMySQLCnf = '# XUI\\n[client]\\nport                            = 3306\\n\\n[mysqld_safe]\\nnice                            = 0\\n\\n[mysqld]\\nuser                            = mysql\\nport                            = 3306\\nbasedir                         = /usr\\ndatadir                         = /var/lib/mysql\\ntmpdir                          = /tmp\\nlc-messages-dir                 = /usr/share/mysql\\nskip-external-locking\\nskip-name-resolve\\nbind-address                    = *\\n\\nkey_buffer_size                 = 128M\\nmyisam_sort_buffer_size         = 4M\\nmax_allowed_packet              = 64M\\nmyisam-recover-options          = BACKUP\\nmax_length_for_sort_data        = 8192\\nquery_cache_limit               = 0\\nquery_cache_size                = 0\\nquery_cache_type                = 0\\nexpire_logs_days                = 10\\nmax_binlog_size                 = 100M\\nmax_connections                 = 8192\\nback_log                        = 4096\\nopen_files_limit                = 20240\\ninnodb_open_files               = 20240\\nmax_connect_errors              = 3072\\ntable_open_cache                = 4096\\ntable_definition_cache          = 4096\\ntmp_table_size                  = 1G\\nmax_heap_table_size             = 1G\\n\\ninnodb_buffer_pool_size         = 10G\\ninnodb_buffer_pool_instances    = 10\\ninnodb_read_io_threads          = 64\\ninnodb_write_io_threads         = 64\\ninnodb_thread_concurrency       = 0\\ninnodb_flush_log_at_trx_commit  = 0\\ninnodb_flush_method             = O_DIRECT\\nperformance_schema              = 0\\ninnodb-file-per-table           = 1\\ninnodb_io_capacity              = 20000\\ninnodb_table_locks              = 0\\ninnodb_lock_wait_timeout        = 0\\n\\nsql_mode                        = "NO_ENGINE_SUBSTITUTION"\\n\\n[mariadb]\\n\\nthread_cache_size               = 8192\\nthread_handling                 = pool-of-threads\\nthread_pool_size                = 12\\nthread_pool_idle_timeout        = 20\\nthread_pool_max_threads         = 1024\\n\\n[mysqldump]\\nquick\\nquote-names\\nmax_allowed_packet              = 16M\\n\\n[mysql]\\n\\n[isamchk]\\nkey_buffer_size                 = 16M'
rConfig = '; XUI Configuration\\n; -----------------\\n; Your username and password will be encrypted and\\n; saved to the \\\'credentials\\\' file in this folder\\n; automatically.\\n;\\n; To change your username or password, modify BOTH\\n; below and XUI will read and re-encrypt them.\\n\\n[XUI]\\nhostname    =   "127.0.0.1"\\ndatabase    =   "xui"\\nport        =   3306\\nserver_id   =   1\\nlicense     =   ""\\n\\n[Encrypted]\\nusername    =   "%s"\\npassword    =   "%s"'
rRedisConfig = "bind *\\nprotected-mode yes\\nport 6379\\ntcp-backlog 511\\ntimeout 0\\ntcp-keepalive 300\\ndaemonize yes\\nsupervised no\\npidfile /home/xui/bin/redis/redis-server.pid\\nloglevel warning\\nlogfile /home/xui/bin/redis/redis-server.log\\ndatabases 1\\nalways-show-logo yes\\nstop-writes-on-bgsave-error no\\nrdbcompression no\\nrdbchecksum no\\ndbfilename dump.rdb\\ndir /home/xui/bin/redis/\\nslave-serve-stale-data yes\\nslave-read-only yes\\nrepl-diskless-sync no\\nrepl-diskless-sync-delay 5\\nrepl-disable-tcp-nodelay no\\nslave-priority 100\\nrequirepass #PASSWORD#\\nmaxclients 655350\\nlazyfree-lazy-eviction no\\nlazyfree-lazy-expire no\\nlazyfree-lazy-server-del no\\nslave-lazy-flush no\\nappendonly no\\nappendfilename \\"appendonly.aof\\"\\nappendfsync everysec\\nno-appendfsync-on-rewrite no\\nauto-aof-rewrite-percentage 100\\nauto-aof-rewrite-min-size 64mb\\naof-load-truncated yes\\naof-use-rdb-preamble no\\nlua-time-limit 5000\\nslowlog-log-slower-than 10000\\nslowlog-max-len 128\\nlatency-monitor-threshold 0\\nnotify-keyspace-events \\"\\"\\nhash-max-ziplist-entries 512\\nhash-max-ziplist-value 64\\nlist-max-ziplist-size -2\\nlist-compress-depth 0\\nset-max-intset-entries 512\\nzset-max-ziplist-entries 128\\nzset-max-ziplist-value 64\\nhll-sparse-max-bytes 3000\\nactiverehashing yes\\nclient-output-buffer-limit normal 0 0 0\\nclient-output-buffer-limit slave 256mb 64mb 60\\nclient-output-buffer-limit pubsub 32mb 8mb 60\\nhz 10\\naof-rewrite-incremental-fsync yes\\nsave 60 1000\\nserver-threads 4\\nserver-thread-affinity true"
rSysCtl = '# XUI.one\\n\\nnet.ipv4.tcp_congestion_control = bbr\\nnet.core.default_qdisc = fq\\nnet.ipv4.tcp_rmem = 8192 87380 134217728\\nnet.ipv4.udp_rmem_min = 16384\\nnet.core.rmem_default = 262144\\nnet.core.rmem_max = 268435456\\nnet.ipv4.tcp_wmem = 8192 65536 134217728\\nnet.ipv4.udp_wmem_min = 16384\\nnet.core.wmem_default = 262144\\nnet.core.wmem_max = 268435456\\nnet.core.somaxconn = 1000000\\nnet.core.netdev_max_backlog = 250000\\nnet.core.optmem_max = 65535\\nnet.ipv4.tcp_max_tw_buckets = 1440000\\nnet.ipv4.tcp_max_orphans = 16384\\nnet.ipv4.ip_local_port_range = 2000 65000\\nnet.ipv4.tcp_no_metrics_save = 1\\nnet.ipv4.tcp_slow_start_after_idle = 0\\nnet.ipv4.tcp_fin_timeout = 15\\nnet.ipv4.tcp_keepalive_time = 300\\nnet.ipv4.tcp_keepalive_probes = 5\\nnet.ipv4.tcp_keepalive_intvl = 15\\nfs.file-max=20970800\\nfs.nr_open=20970800\\nfs.aio-max-nr=20970800\\nnet.ipv4.tcp_timestamps = 1\\nnet.ipv4.tcp_window_scaling = 1\\nnet.ipv4.tcp_mtu_probing = 1\\nnet.ipv4.route.flush = 1\\nnet.ipv6.route.flush = 1'
rSystemd = '[Unit]\\nSourcePath=/home/xui/service\\nDescription=XUI.one Service\\nAfter=network.target\\nStartLimitIntervalSec=0\\n\\n[Service]\\nType=simple\\nUser=root\\nRestart=always\\nRestartSec=1\\nExecStart=/bin/bash /home/xui/service start\\nExecRestart=/bin/bash /home/xui/service restart\\nExecStop=/bin/bash /home/xui/service stop\\n\\n[Install]\\nWantedBy=multi-user.target'
rChoice = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ"

def generate(length=32): return ''.join(random.choice(rChoice) for i in range(length))

def getIP():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    return s.getsockname()[0]

if __name__ == "__main__":
    archive = "./xui.tar.gz" if os.path.exists("./xui.tar.gz") else "./xui_trial.tar.gz"
    if not os.path.exists(archive):
        print("Fatal Error: binaries missing.")
        sys.exit(1)
    
    rUsername = generate() ; rPassword = generate()
    for rPackage in rRemove:
        os.system("sudo DEBIAN_FRONTEND=noninteractive apt-get remove %s -y >/dev/null 2>&1" % rPackage)
    for rPackage in rPackages:
        os.system("sudo DEBIAN_FRONTEND=noninteractive apt-get -yq install %s >/dev/null 2>&1" % rPackage)
    
    try: subprocess.check_output("getent passwd xui".split())
    except:
        os.system("sudo adduser --system --shell /bin/false --group --disabled-login xui >/dev/null 2>&1")
    
    os.system("mkdir -p /home/xui")
    os.system('sudo tar -zxvf "' + archive + '" -C "/home/xui/" >/dev/null 2>&1')
    
    with io.open("/etc/mysql/my.cnf", "w", encoding="utf-8") as f:
        f.write(rMySQLCnf)
    os.system("sudo service mariadb restart >/dev/null 2>&1")
    
    os.system('sudo mysql -u root -e "DROP DATABASE IF EXISTS xui; CREATE DATABASE IF NOT EXISTS xui;"')
    os.system('sudo mysql -u root -e "DROP DATABASE IF EXISTS xui_migrate; CREATE DATABASE IF NOT EXISTS xui_migrate;"')
    os.system('sudo mysql -u root xui < "/home/xui/bin/install/database.sql"')
    os.system('sudo mysql -u root -e "CREATE USER \\\'%s\\\'@\\\'localhost\\\' IDENTIFIED BY \\\'%s\\\';" % (rUsername, rPassword))
    os.system('sudo mysql -u root -e "GRANT ALL PRIVILEGES ON xui.* TO \\\'%s\\\'@\\\'localhost\\\';" % rUsername)
    os.system('sudo mysql -u root -e "GRANT ALL PRIVILEGES ON xui_migrate.* TO \\\'%s\\\'@\\\'localhost\\\';" % rUsername)
    os.system('sudo mysql -u root -e "GRANT ALL PRIVILEGES ON mysql.* TO \\\'%s\\\'@\\\'localhost\\\';" % rUsername)
    os.system('sudo mysql -u root -e "FLUSH PRIVILEGES;"')
    
    rConfigData = rConfig % (rUsername, rPassword)
    with io.open("/home/xui/config/config.ini", "w", encoding="utf-8") as f:
        f.write(rConfigData)

    with io.open("/etc/systemd/system/xuione.service", "w", encoding="utf-8") as f:
        f.write(rSystemd)
    os.system("sudo systemctl daemon-reload && sudo systemctl enable xuione")
    
    with io.open("/etc/sysctl.conf", "w", encoding="utf-8") as f:
        f.write(rSysCtl)
    os.system("sudo sysctl -p >/dev/null 2>&1")
    
    rCode = generate(8)
    os.system('sudo mysql -u root -e "USE xui; INSERT INTO access_codes(code, type, enabled, groups) VALUES(\\\'%s\\\', 0, 1, \\\'[1]\\\');"' % rCode)
    
    rCodeDir = "/home/xui/bin/nginx/conf/codes/"
    with open(rCodeDir + "template", "r") as f:
        rTemplate = f.read().replace("#WHITELIST#", "").replace("#TYPE#", "admin").replace("#CODE#", rCode).replace("#BURST#", "500")
    with io.open("%s%s.conf" % (rCodeDir, rCode), "w", encoding="utf-8") as f:
        f.write(rTemplate)

    os.system("sudo chown xui:xui -R /home/xui")
    os.system("sudo systemctl start xuione")
    print("XUI_SUCCESS:" + rCode)
`;

            // 3. Define the PHP build script (build-php.sh logic)
            const buildPhpSh = `#!/bin/bash
mkdir -p /root/phpbuild/
cd /root/phpbuild/
wget --no-check-certificate https://www.php.net/distributions/php-7.4.33.tar.gz -O /root/phpbuild/php-7.4.33.tar.gz
tar -xvf /root/phpbuild/php-7.4.33.tar.gz
wget --no-check-certificate "https://launchpad.net/~ondrej/+archive/ubuntu/php/+sourcefiles/php7.3/7.3.33-2+ubuntu22.04.1+deb.sury.org+1/php7.3_7.3.33-2+ubuntu22.04.1+deb.sury.org+1.debian.tar.xz" -O /root/phpbuild/debian.tar.xz
tar -xf /root/phpbuild/debian.tar.xz
cd /root/phpbuild/php-7.4.33
patch -p1 < ../debian/patches/0060-Add-minimal-OpenSSL-3.0-patch.patch
'./configure' '--prefix=/home/xui/bin/php' '--with-fpm-user=xui' '--with-fpm-group=xui' '--enable-gd' '--with-jpeg' '--with-freetype' '--enable-static' '--disable-shared' '--enable-opcache' '--enable-fpm' '--without-sqlite3' '--without-pdo-sqlite' '--enable-mysqlnd' '--with-mysqli' '--with-curl' '--disable-cgi' '--with-zlib' '--enable-sockets' '--with-openssl' '--enable-shmop' '--enable-sysvsem' '--enable-sysvshm' '--enable-sysvmsg' '--enable-calendar' '--disable-rpath' '--enable-inline-optimization' '--enable-pcntl' '--enable-mbregex' '--enable-exif' '--enable-bcmath' '--with-mhash' '--with-gettext' '--with-xmlrpc' '--with-xsl' '--with-libxml' '--with-pdo-mysql' '--disable-mbregex'
make -j$(nproc --all)
killall php php-fpm || true
make install
cd /root
rm -rf /root/phpbuild/
`;

            const encodedInstallSh = Buffer.from(installSh).toString('base64');
            const encodedInstallPy = Buffer.from(installPy).toString('base64');
            const encodedBuildPhpSh = Buffer.from(buildPhpSh).toString('base64');

            logToUI('Writing XUI core scripts to server...');
            await ssh.execCommand(`echo '${encodedInstallSh}' | base64 -d > /root/install.sh && chmod +x /root/install.sh`);
            await ssh.execCommand(`echo '${encodedInstallPy}' | base64 -d > /root/install.python3`);
            await ssh.execCommand(`echo '${encodedBuildPhpSh}' | base64 -d > /root/build-php.sh && chmod +x /root/build-php.sh`);

            logToUI('Initiating Module 1: System Readiness & Scaffolding...');
            await ssh.execCommand('bash /root/install.sh', {
                onStdout: (chunk) => logToUI(chunk.toString().trim()),
                onStderr: (chunk) => logToUI('WARN: ' + chunk.toString().trim())
            });

            logToUI('Initiating Module 2: PHP 7.4.33 Source Compilation (Extended Task)...');
            await ssh.execCommand('bash /root/build-php.sh', {
                onStdout: (chunk) => logToUI(chunk.toString().trim()),
                onStderr: (chunk) => logToUI('BUILD_LOG: ' + chunk.toString().trim())
            });

            logToUI('Initiating Module 3: Protocol Core & DB Provisioning...');
            const pyResult = await ssh.execCommand('python3 /root/install.python3', {
                onStdout: (chunk) => logToUI(chunk.toString().trim()),
                onStderr: (chunk) => logToUI('XUI_PY: ' + chunk.toString().trim())
            });

            logToUI('Initiating Module 4: Applied Logic Patch & Verification...');
            const crackScript = `
wget https://panel.purakura.app/custom/installers/xui_crack.tar.gz -O /root/xui_crack.tar.gz
tar -xvf /root/xui_crack.tar.gz -C /root/
sudo systemctl stop xuione
cp -r /root/license /home/xui/config/license
cp -r /root/xui.so /home/xui/bin/php/lib/php/extensions/no-debug-non-zts-20190902/xui.so
sed -i "s/^license.*/license     =   \\"cracked\\"/g" /home/xui/config/config.ini
sudo systemctl start xuione
/home/xui/bin/php/bin/php /home/xui/includes/cli/startup.php
`;
            await ssh.execCommand(crackScript, {
                onStdout: (chunk) => logToUI(chunk.toString().trim())
            });

            const accessCodeMatch = pyResult.stdout.match(/XUI_SUCCESS:(.+)/);
            const accessCode = accessCodeMatch ? accessCodeMatch[1] : 'Unknown';

            logToUI('Elite XUI Deployment Synchronized!');
            logToUI('Remote Access Code: ' + accessCode);
            logToUI('Gateway URL: http://' + config.serverHost + '/' + accessCode);

            ssh.dispose();
            return { success: true, accessCode };
        } catch (err) {
            logToUI('CRITICAL ERROR: ' + err.message);
            ssh.dispose();
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('scan-xui-server', async (_event, config) => {
        const ssh = new NodeSSH();
        try {
            const configuredPort = parseInt((config.xuiPort || '80').toString(), 10) || 80;
            await connectToServer(ssh, config);
            const serverHealth = await collectServerHealth(ssh, { configuredPort });

            const scanScript = `#!/bin/bash
XUI_PORT="${configuredPort}"
SERVICES="xuione xui x-ui"
FOUND_SERVICE=""
FOUND_ACTIVE="false"
for svc in $SERVICES; do
    if systemctl list-unit-files 2>/dev/null | awk '{print $1}' | grep -q "^${svc}\\.service$"; then
        FOUND_SERVICE="$svc"
        STATE=$(systemctl is-active "$svc" 2>/dev/null || echo "inactive")
        if [ "$STATE" = "active" ]; then
            FOUND_ACTIVE="true"
            break
        fi
    fi
done

INSTALL_MARKER="false"
if [ -d /home/xui ] || [ -f /home/xui/service ]; then
    INSTALL_MARKER="true"
fi

if [ "$FOUND_ACTIVE" = "true" ]; then
    XUI_STATUS="active"
elif [ -n "$FOUND_SERVICE" ]; then
    XUI_STATUS="installed_stopped"
elif [ "$INSTALL_MARKER" = "true" ]; then
    XUI_STATUS="installed_unknown"
else
    XUI_STATUS="not_installed"
fi

CF_STATUS=$(systemctl is-active cloudflared 2>/dev/null || echo "inactive")
if command -v ss >/dev/null 2>&1; then
    PORT_LINES=$(ss -tln 2>/dev/null | awk '{print $4}')
elif command -v netstat >/dev/null 2>&1; then
    PORT_LINES=$(netstat -tln 2>/dev/null | awk '{print $4}')
else
    PORT_LINES=""
fi

DETECTED_PORT=""
if echo "$PORT_LINES" | grep -qE ":$XUI_PORT$"; then
    DETECTED_PORT="$XUI_PORT"
else
    for p in 80 443 2053 2083 2087 8443; do
        if echo "$PORT_LINES" | grep -qE ":$p$"; then
            DETECTED_PORT="$p"
            break
        fi
    done
fi

echo "XUI|||$XUI_STATUS|||$XUI_PORT|||$DETECTED_PORT|||$FOUND_SERVICE|||$INSTALL_MARKER"
echo "CF|||$CF_STATUS"
`;

            const encoded = Buffer.from(scanScript).toString('base64');
            const result = await ssh.execCommand(`echo '${encoded}' | base64 -d | bash`);
            ssh.dispose();

            let xuiStatus = 'inactive';
            let detectedPort = null;
            let detectedService = '';
            let installMarker = false;
            let cloudflareStatus = 'inactive';

            for (const line of (result.stdout || '').split('\n')) {
                const trimmed = line.trim();
                if (trimmed.startsWith('XUI|||')) {
                    const parts = trimmed.split('|||');
                    xuiStatus = parts[1] || 'inactive';
                    const portRaw = parts[3] ? parseInt(parts[3].trim(), 10) : null;
                    detectedPort = portRaw && !isNaN(portRaw) ? portRaw : null;
                    detectedService = (parts[4] || '').trim();
                    installMarker = (parts[5] || '').trim() === 'true';
                } else if (trimmed.startsWith('CF|||')) {
                    cloudflareStatus = trimmed.split('|||')[1] || 'inactive';
                }
            }

            return {
                success: true,
                xuiStatus,
                configuredPort,
                detectedPort,
                detectedService,
                installMarker,
                cloudflareStatus,
                serverHealth
            };
        } catch (err) {
            try { ssh.dispose(); } catch (_e) {}
            return { success: false, error: err.message };
        }
    });
}

module.exports = { registerXuiHandlers };
