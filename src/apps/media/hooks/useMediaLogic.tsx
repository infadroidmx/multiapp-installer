import { useEffect, useMemo, useState } from 'react';
import { addServerProfile, createServerProfileStore, duplicateServerProfile, getActiveServerProfile, removeServerProfile, renameServerProfile, selectServerProfile, updateActiveServerProfile } from '../../../utils/serverProfiles';
import { clearProfileHistory, getProfileActivityHistory, recordActivity } from '../../../utils/activityHistory';

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

const DEFAULT_PORTS = {
    portainer: '9000',
    sabnzbd: '8080',
    deluge: '8112',
    jackett: '9117',
    flaresolverr: '8191',
    radarr: '7878',
    sonarr: '8989',
    profilarr: '6868',
    requesterr: '4545'
};

export interface ServiceScanInfo {
    status: string;
    port: number | null;
    composeDir: string;
    image: string;
}

export interface ScanResults {
    success: boolean;
    error?: string;
    dockerInstalled?: boolean;
    containers: Record<string, ServiceScanInfo>;
    cloudflareStatus: string;
    serverHealth?: any;
}

export const useMediaLogic = () => {
    const createDefaultConfig = () => ({
        mediaTimezone: 'UTC',
        mediaPuid: '1000',
        mediaPgid: '1000',
        mediaStackDir: '/root/media-stack',
        cloudflareEnabled: false,
        cloudflareToken: '',
        serverHost: '',
        serverUser: 'root',
        serverPassword: '',
        mediaServices: { ...DEFAULT_SERVICES },
        mediaPorts: { ...DEFAULT_PORTS }
    });

    const [profileStore, setProfileStore] = useState<any>(createServerProfileStore({}, createDefaultConfig));
    const [log, setLog] = useState<string[]>([]);
    const [deployMode, setDeployMode] = useState('deploy');
    const [isDeploying, setIsDeploying] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [scanResults, setScanResults] = useState<ScanResults | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<any>(null);
    const [activityHistory, setActivityHistory] = useState<any[]>([]);
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
            appId: 'media',
            profileId: profile.id,
            profileName: profile.name || importedName,
            action: 'Import Config',
            status: 'success',
            message: `Profile "${importedName}" imported from JSON.`
        });
        setActivityHistory(getProfileActivityHistory('media', profile.id, 12));
    };

    useEffect(() => {
        if (!window.electronAPI) return;

        window.electronAPI.loadAppConfig('media').then((data: any) => {
            const store = createServerProfileStore(data || {}, createDefaultConfig);
            const normalized = {
                ...store,
                serverProfiles: store.serverProfiles.map((profile: any) => ({
                    ...profile,
                    config: {
                        ...createDefaultConfig(),
                        ...(profile.config || {}),
                        mediaServices: {
                            ...DEFAULT_SERVICES,
                            ...((profile.config || {}).mediaServices || {})
                        },
                        mediaPorts: {
                            ...DEFAULT_PORTS,
                            ...((profile.config || {}).mediaPorts || {})
                        }
                    }
                }))
            };
            setProfileStore(normalized);
        });

        window.electronAPI.onLogMessage((msg: string) => {
            setLog((prev) => [...prev, msg]);
        });
    }, []);

    const activeProfile = useMemo(() => getActiveServerProfile(profileStore as any) as any, [profileStore]);
    const config: any = activeProfile?.config || createDefaultConfig();
    const activeProfileName = activeProfile?.name || 'Server';

    useEffect(() => {
        const profileId = activeProfile?.id;
        if (!profileId) {
            setActivityHistory([]);
            return;
        }
        setActivityHistory(getProfileActivityHistory('media', profileId, 12));
    }, [activeProfile?.id]);

    const pushActivity = (action: string, status: 'success' | 'error' | 'info', message: string) => {
        const currentProfile = getActiveServerProfile(profileStore as any) as any;
        if (!currentProfile?.id) return;
        recordActivity({
            appId: 'media',
            profileId: currentProfile.id,
            profileName: currentProfile.name || 'Server',
            action,
            status,
            message
        });
        setActivityHistory(getProfileActivityHistory('media', currentProfile.id, 12));
    };

    const selectedCount = useMemo(() => {
        const services = config.mediaServices || {};
        return Object.values(services).filter(Boolean).length;
    }, [config.mediaServices]);

    const hasRunningServices = useMemo(() => {
        if (!scanResults?.success) return false;
        return Object.values(scanResults.containers || {}).some((info: any) => info.status === 'running');
    }, [scanResults]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileStore((prev: any) => updateActiveServerProfile(prev, { ...getProfileConfig(prev), [name]: value }));
        setHasUnsavedChanges(true);
    };

    const toggleService = (name: string) => {
        setProfileStore((prev: any) => {
            const currentConfig: any = getProfileConfig(prev);
            return updateActiveServerProfile(prev, {
                ...currentConfig,
                mediaServices: {
                    ...(currentConfig.mediaServices || {}),
                    [name]: !currentConfig?.mediaServices?.[name]
                }
            });
        });
        setHasUnsavedChanges(true);
    };

    const setServicePort = (name: string, value: string) => {
        setProfileStore((prev: any) => {
            const currentConfig: any = getProfileConfig(prev);
            return updateActiveServerProfile(prev, {
                ...currentConfig,
                mediaPorts: {
                    ...(currentConfig.mediaPorts || {}),
                    [name]: value
                }
            });
        });
        setHasUnsavedChanges(true);
    };

    const toggleCloudflare = () => {
        setProfileStore((prev: any) => {
            const currentConfig: any = getProfileConfig(prev);
            return updateActiveServerProfile(prev, { ...currentConfig, cloudflareEnabled: !currentConfig.cloudflareEnabled });
        });
        setHasUnsavedChanges(true);
    };

    const handleSave = async () => {
        if (!window.electronAPI) return false;
        setIsSaving(true);
        setLog((prev) => [...prev, `--- Saving Media profile: ${activeProfileName} ---`]);
        await window.electronAPI.saveAppConfig('media', profileStore);
        pushActivity('Save Config', 'success', 'Profile configuration saved.');
        setHasUnsavedChanges(false);
        setTimeout(() => setIsSaving(false), 500);
        return true;
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
            [JSON.stringify({ profileName: activeProfileName, app: 'media', config }, null, 2)],
            { type: 'application/json' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeProfileName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-media-config.json`;
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
        clearProfileHistory('media', currentProfile.id);
        setActivityHistory([]);
    };

    const handleTestConnection = async () => {
        if (!window.electronAPI) return;
        if (!config.serverHost || !config.serverUser || !config.serverPassword) {
            setLog((prev) => [...prev, 'ERROR: Server host, user and password are required to test the connection.']);
            return;
        }
        setIsTestingConnection(true);
        setLog((prev) => [...prev, `--- Testing Media connection: ${activeProfileName} ---`]);
        const result = await window.electronAPI.testServerConnection(config);
        setIsTestingConnection(false);
        if (result.success) {
            setConnectionStatus(result);
            setLog((prev) => [...prev, `Connection OK: ${result.serverHealth.hostname || config.serverHost} | ${result.serverHealth.os || 'Unknown OS'}`]);
            pushActivity('Test Connection', 'success', `Connected to ${result.serverHealth.hostname || config.serverHost}.`);
        } else {
            setConnectionStatus(null);
            setLog((prev) => [...prev, `ERROR: Connection test failed - ${result.error}`]);
            pushActivity('Test Connection', 'error', result.error || 'Connection test failed.');
        }
    };

    const handleScan = async () => {
        if (!window.electronAPI) return;
        if (!config.serverHost || !config.serverUser || !config.serverPassword) {
            setLog((prev) => [...prev, 'ERROR: Server host, user and password are required to scan.']);
            return;
        }
        setIsScanning(true);
        setLog((prev) => [...prev, `--- Scanning Media server: ${activeProfileName} ---`]);
        const result = await (window.electronAPI as any).scanMediaServer(config);
        setIsScanning(false);
        if (result.success) {
            setScanResults(result);
            setConnectionStatus({ success: true, serverHealth: result.serverHealth });
            pushActivity('Sync Server', 'success', 'Server state synchronized successfully.');
            if (!result.dockerInstalled) {
                setLog((prev) => [...prev, 'Docker is not installed on this server yet.']);
            } else {
                const running = Object.entries(result.containers || {})
                    .filter(([, info]: any) => info.status === 'running')
                    .map(([name]) => name);
                const stopped = Object.entries(result.containers || {})
                    .filter(([, info]: any) => info.status !== 'running' && info.status !== 'not_found')
                    .map(([name]) => name);
                if (running.length > 0) setLog((prev) => [...prev, `Running: ${running.join(', ')}`]);
                if (stopped.length > 0) setLog((prev) => [...prev, `Stopped: ${stopped.join(', ')}`]);
                if (running.length === 0 && stopped.length === 0) setLog((prev) => [...prev, 'No media services found on this server.']);
                const cfStatus = result.cloudflareStatus === 'active' ? 'Active' : 'Inactive';
                setLog((prev) => [...prev, `Cloudflare Tunnel: ${cfStatus}`]);
            }
        } else {
            setLog((prev) => [...prev, `ERROR: Scan failed - ${result.error}`]);
            pushActivity('Sync Server', 'error', result.error || 'Server sync failed.');
        }
    };

    const handleDeploy = async () => {
        if (!window.electronAPI) return;
        const activityAction = deployMode === 'remove-all'
            ? 'Remove Stack'
            : deployMode === 'remove-tunnel'
                ? 'Remove Tunnel'
                : hasRunningServices
                    ? 'Update Stack'
                    : 'Deploy Stack';
        if (!config.serverHost || !config.serverUser || !config.serverPassword) {
            setLog((prev) => [...prev, 'ERROR: Server host, user and password are required.']);
            return;
        }
        if (deployMode === 'deploy' && config.cloudflareEnabled && !(config.cloudflareToken || '').toString().trim()) {
            setLog((prev) => [...prev, 'ERROR: Cloudflare Tunnel is enabled but no tunnel token was provided.']);
            return;
        }
        if (deployMode === 'deploy' && selectedCount === 0) {
            setLog((prev) => [...prev, 'ERROR: Select at least one service to deploy.']);
            return;
        }

        if (hasUnsavedChanges) {
            const saved = await handleSave();
            if (!saved) return;
        }

        const label = deployMode === 'remove-all'
            ? 'Removal'
            : deployMode === 'remove-tunnel'
                ? 'Tunnel Cleanup'
                : hasRunningServices
                    ? 'Update'
                    : 'Deployment';
        setIsDeploying(true);
        setLog([`--- Starting Media Stack ${label}: ${activeProfileName} ---`]);
        const result = await (window.electronAPI as any).deployMedia(config, deployMode);
        setIsDeploying(false);
        setScanResults(null);
        if (result?.success === false) {
            pushActivity(activityAction, 'error', result.error || `${activityAction} failed.`);
        } else {
            const successMessage = deployMode === 'remove-all'
                ? 'Media stack removal command sent successfully.'
                : deployMode === 'remove-tunnel'
                    ? 'Cloudflare tunnel removal command sent successfully.'
                    : 'Deployment command sent successfully.';
            pushActivity(activityAction, 'success', successMessage);
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
        hasUnsavedChanges,
        selectedCount,
        scanResults,
        isScanning,
        isTestingConnection,
        connectionStatus,
        activityHistory,
        serverHealth: connectionStatus?.serverHealth || scanResults?.serverHealth || null,
        hasRunningServices,
        activeProfileName,
        handleTextChange,
        toggleService,
        setServicePort,
        toggleCloudflare,
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
