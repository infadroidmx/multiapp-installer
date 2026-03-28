const { NodeSSH } = require('node-ssh');
const crypto = require('crypto');
const { logToUI } = require('../utils/logger.cjs');

function registerUserHandlers(ipcMain) {
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
}

module.exports = { registerUserHandlers };
