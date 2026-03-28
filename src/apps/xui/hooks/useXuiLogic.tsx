import { useState, useEffect } from 'react';
import { addServerProfile, createServerProfileStore, duplicateServerProfile, getActiveServerProfile, removeServerProfile, renameServerProfile, selectServerProfile, updateActiveServerProfile } from '../../../utils/serverProfiles';
import { clearProfileHistory, getProfileActivityHistory, recordActivity } from '../../../utils/activityHistory';

export const useXuiLogic = () => {
    const createDefaultConfig = () => ({
        serverHost: '',
        serverUser: 'root',
        serverPassword: '',
        xuiDatabase: 'xui',
        xuiPort: '80',
        adminAlias: 'admin',
        enableBBR: 'true',
        enableRedis: 'true',
        cloudflareToken: ''
    });

    const [profileStore, setProfileStore] = useState<any>(createServerProfileStore({}, createDefaultConfig));
    const [log, setLog] = useState<string[]>([]);
    const [deployMode, setDeployMode] = useState('deploy');
    const [isDeploying, setIsDeploying] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [scanResults, setScanResults] = useState<any>(null);
    const [connectionStatus, setConnectionStatus] = useState<any>(null);
    const [activityHistory, setActivityHistory] = useState<any[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [accessCode, setAccessCode] = useState<string | null>(null);
    const getProfileConfig = (store: any): any => ((getActiveServerProfile(store as any) as any)?.config || createDefaultConfig());
    const applyProfileStore = (nextStore: any, markDirty = false) => {
        setProfileStore(nextStore);
        setScanResults(null);
        setConnectionStatus(null);
        if (markDirty) {
            setHasUnsavedChanges(true);
        }
    };
    const recordImportedProfileActivity = (profile: any, importedName: string) => {
        if (!profile?.id) return;
        recordActivity({
            appId: 'xui',
            profileId: profile.id,
            profileName: profile.name || importedName,
            action: 'Import Config',
            status: 'success',
            message: `Profile "${importedName}" imported from JSON.`
        });
        setActivityHistory(getProfileActivityHistory('xui', profile.id, 12));
    };

    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.loadAppConfig('xui').then((data: any) => {
                const store = createServerProfileStore(data || {}, createDefaultConfig);
                const normalized = {
                    ...store,
                    serverProfiles: store.serverProfiles.map((profile: any) => ({
                        ...profile,
                        config: {
                            ...createDefaultConfig(),
                            ...(profile.config || {})
                        }
                    }))
                };
                setProfileStore(normalized);
            });
            window.electronAPI.onLogMessage((msg: string) => {
                setLog(prev => [...prev, msg]);
            });
        }
    }, []);

    const config: any = getProfileConfig(profileStore);
    const activeProfileName = (profileStore.serverProfiles || []).find((profile: any) => profile.id === profileStore.activeServerProfileId)?.name || 'Server';

    useEffect(() => {
        const profileId = profileStore.activeServerProfileId;
        if (!profileId) {
            setActivityHistory([]);
            return;
        }
        setActivityHistory(getProfileActivityHistory('xui', profileId, 12));
    }, [profileStore.activeServerProfileId]);

    const pushActivity = (action: string, status: 'success' | 'error' | 'info', message: string) => {
        const currentProfile = getActiveServerProfile(profileStore as any) as any;
        if (!currentProfile?.id) return;
        recordActivity({
            appId: 'xui',
            profileId: currentProfile.id,
            profileName: currentProfile.name || 'Server',
            action,
            status,
            message
        });
        setActivityHistory(getProfileActivityHistory('xui', currentProfile.id, 12));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileStore((prev: any) => updateActiveServerProfile(prev, { ...getProfileConfig(prev), [e.target.name]: e.target.value }));
        setHasUnsavedChanges(true);
    };

    const handleSave = async () => {
        if (!window.electronAPI) return;
        setIsSaving(true);
        setLog(prev => [...prev, `--- Saving XUI profile: ${activeProfileName} ---`]);
        await window.electronAPI.saveAppConfig('xui', profileStore);
        pushActivity('Save Config', 'success', 'Profile configuration saved.');
        setHasUnsavedChanges(false);
        setTimeout(() => setIsSaving(false), 500);
    };

    const handleSelectProfile = (profileId: string) => {
        applyProfileStore(selectServerProfile(profileStore, profileId));
    };

    const handleCreateProfile = (name: string) => {
        applyProfileStore(addServerProfile(profileStore, name, createDefaultConfig), true);
    };

    const handleDeleteProfile = (profileId: string) => {
        applyProfileStore(removeServerProfile(profileStore, profileId), true);
    };

    const handleRenameProfile = (profileId: string, newName: string) => {
        setProfileStore((prev: any) => renameServerProfile(prev, profileId, newName));
        setHasUnsavedChanges(true);
    };

    const handleDuplicateProfile = (profileId: string, newName: string) => {
        applyProfileStore(duplicateServerProfile(profileStore, profileId, newName), true);
    };

    const handleExportProfile = () => {
        const blob = new Blob(
            [JSON.stringify({ profileName: activeProfileName, app: 'xui', config }, null, 2)],
            { type: 'application/json' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeProfileName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-xui-config.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        pushActivity('Export Config', 'success', `Profile "${activeProfileName}" exported to JSON.`);
    };

    const handleImportProfile = (data: any) => {
        const importedConfig = data?.config || data;
        const importedName = data?.profileName ? `${data.profileName} (imported)` : 'Imported Server';
        const nextStore = addServerProfile(profileStore, importedName, () => ({ ...createDefaultConfig(), ...importedConfig }));
        const importedProfile = getActiveServerProfile(nextStore as any) as any;
        applyProfileStore(nextStore, true);
        recordImportedProfileActivity(importedProfile, importedName);
    };

    const handleClearHistory = () => {
        const currentProfile = getActiveServerProfile(profileStore as any) as any;
        if (!currentProfile?.id) return;
        clearProfileHistory('xui', currentProfile.id);
        setActivityHistory([]);
    };

    const handleTestConnection = async () => {
        if (!window.electronAPI) return;
        if (!config.serverHost || !config.serverUser || !config.serverPassword) {
            setLog(prev => [...prev, 'ERROR: Server host, user and password are required to test the connection.']);
            return;
        }

        setIsTestingConnection(true);
        setLog(prev => [...prev, `--- Testing XUI connection: ${activeProfileName} ---`]);
        const result = await window.electronAPI.testServerConnection(config, {
            configuredPort: parseInt((config.xuiPort || '80').toString(), 10) || 80
        });
        setIsTestingConnection(false);

        if (result.success) {
            setConnectionStatus(result);
            setLog(prev => [...prev, `Connection OK: ${result.serverHealth.hostname || config.serverHost} | ${result.serverHealth.os || 'Unknown OS'}`]);
            pushActivity('Test Connection', 'success', `Connected to ${result.serverHealth.hostname || config.serverHost}.`);
        } else {
            setConnectionStatus(null);
            setLog(prev => [...prev, `ERROR: Connection test failed - ${result.error}`]);
            pushActivity('Test Connection', 'error', result.error || 'Connection test failed.');
        }
    };

    const handleDeploy = async () => {
        if (!window.electronAPI) return;
        if (hasUnsavedChanges) {
            await handleSave();
        }
        const actionLabel = deployMode === 'remove' ? 'Removal' : deployMode === 'remove-tunnel' ? 'Tunnel Cleanup' : 'Deployment';
        const activityAction = deployMode === 'remove'
            ? 'Remove XUI'
            : deployMode === 'remove-tunnel'
                ? 'Remove Tunnel'
                : 'Deploy XUI';
        setIsDeploying(true);
        setLog([`--- Initializing XUI ${actionLabel}: ${activeProfileName} ---`]);
        setAccessCode(null);

        const result = await (window.electronAPI as any).deployXui(config, deployMode);

        if (result.success) {
            setAccessCode(result.accessCode || null);
            const successMessage = deployMode === 'remove'
                ? 'XUI stack removed successfully.'
                : deployMode === 'remove-tunnel'
                    ? 'Cloudflare tunnel removed successfully.'
                    : `Deployment completed with access code ${result.accessCode}.`;
            pushActivity(activityAction, 'success', successMessage);
        } else {
            pushActivity(activityAction, 'error', result.error || `${activityAction} failed.`);
        }
        setIsDeploying(false);
    };

    const handleScan = async () => {
        if (!window.electronAPI) return;
        if (!config.serverHost || !config.serverUser || !config.serverPassword) {
            setLog(prev => [...prev, 'ERROR: Server host, user and password are required to scan.']);
            return;
        }

        setIsScanning(true);
        setLog(prev => [...prev, `--- Scanning XUI server: ${activeProfileName} ---`]);
        const result = await (window.electronAPI as any).scanXuiServer(config);
        setIsScanning(false);

        if (result.success) {
            setScanResults(result);
            setConnectionStatus({ success: true, serverHealth: result.serverHealth });
            pushActivity('Sync Server', 'success', 'Server state synchronized successfully.');
            setLog(prev => [...prev, `XUI service: ${result.xuiStatus}`]);
            setLog(prev => [...prev, `Configured panel port: ${result.configuredPort}`]);
            setLog(prev => [...prev, `Detected listening port: ${result.detectedPort || 'N/A'}`]);
            setLog(prev => [...prev, `Cloudflare Tunnel: ${result.cloudflareStatus}`]);
        } else {
            setLog(prev => [...prev, `ERROR: Scan failed - ${result.error}`]);
            pushActivity('Sync Server', 'error', result.error || 'Server sync failed.');
        }
    };

    return {
        config,
        profiles: profileStore.serverProfiles.map((profile: any) => ({ id: profile.id, name: profile.name })),
        activeProfileId: profileStore.activeServerProfileId,
        log,
        deployMode,
        setDeployMode,
        isDeploying,
        isSaving,
        isScanning,
        isTestingConnection,
        hasUnsavedChanges,
        accessCode,
        activityHistory,
        activeProfileName,
        scanResults,
        connectionStatus,
        serverHealth: connectionStatus?.serverHealth || scanResults?.serverHealth || null,
        handleChange,
        handleSelectProfile,
        handleCreateProfile,
        handleDeleteProfile,
        handleSave,
        handleTestConnection,
        handleScan,
        handleDeploy,
        handleRenameProfile,
        handleDuplicateProfile,
        handleExportProfile,
        handleImportProfile,
        handleClearHistory
    };
};
