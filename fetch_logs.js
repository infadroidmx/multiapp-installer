const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync('C:/Users/fhuez/AppData/Roaming/multiapp-installer/postiz-config.json', 'utf-8'));

const passwords = ['password', 'huezorising_grant'];

async function tryConnect(password) {
    const ssh = new NodeSSH();
    console.log(`Trying password: ${password}`);
    try {
        await ssh.connect({
            host: config.serverHost,
            username: config.serverUser,
            password: password,
            readyTimeout: 10000
        });
        console.log('Connected!');
        const result = await ssh.execCommand('docker logs postiz --tail 100 2>&1');
        console.log('--- LOGS ---');
        console.log(result.stdout);
        console.log(result.stderr);
        console.log('--- END LOGS ---');
        
        console.log('\n--- CONTAINER STATUS ---');
        const psResult = await ssh.execCommand('docker ps -a');
        console.log(psResult.stdout);
        
        ssh.dispose();
        process.exit(0);
    } catch (err) {
        console.log(`Failed with password ${password}: ${err.message}`);
        ssh.dispose();
    }
}

async function main() {
    for (const pw of passwords) {
        await tryConnect(pw);
    }
}

main();
