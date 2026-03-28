import { useState, useEffect } from 'react';
import { addServerProfile, createServerProfileStore, duplicateServerProfile, getActiveServerProfile, removeServerProfile, renameServerProfile, selectServerProfile, updateActiveServerProfile } from '../../../utils/serverProfiles';
import { clearProfileHistory, getProfileActivityHistory, recordActivity } from '../../../utils/activityHistory';

const PROVIDER_FLAG_FIELDS: Record<string, string> = {
    twitter: 'X_API_KEY',
    linkedin: 'LINKEDIN_CLIENT_ID',
    facebook: 'FACEBOOK_APP_ID',
    instagram: 'INSTAGRAM_CLIENT_ID',
    youtube: 'YOUTUBE_CLIENT_ID',
    tiktok: 'TIKTOK_CLIENT_ID',
    pinterest: 'PINTEREST_CLIENT_ID',
    discord: 'DISCORD_CLIENT_ID',
    reddit: 'REDDIT_CLIENT_ID',
    github: 'GITHUB_CLIENT_ID',
    mastodon: 'MASTODON_CLIENT_ID',
    threads: 'THREADS_APP_ID',
    beehiiv: 'BEEHIIVE_API_KEY',
    dribbble: 'DRIBBBLE_CLIENT_ID',
    slack: 'SLACK_ID'
};

export const usePostizLogic = () => {
    const createDefaultConfig = () => ({
        serverHost: '',
        serverUser: 'root',
        serverPassword: '',
        STORAGE_PROVIDER: 'local',
        UPLOAD_DIRECTORY: '/uploads',
        NEXT_PUBLIC_UPLOAD_DIRECTORY: '/uploads',
        POSTIZ_PORT: '4007',
        POSTIZ_IMAGE: 'ghcr.io/gitroomhq/postiz-app:latest',
        JWT_SECRET: Array.from(window.crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')
    });

    const [profileStore, setProfileStore] = useState<any>(createServerProfileStore({}, createDefaultConfig));
    const [log, setLog] = useState<string[]>([]);
    const [deployMode, setDeployMode] = useState('update');
    const [isDeploying, setIsDeploying] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingLogs, setIsFetchingLogs] = useState(false);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [scanResults, setScanResults] = useState<any>(null);
    const [connectionStatus, setConnectionStatus] = useState<any>(null);
    const [activityHistory, setActivityHistory] = useState<any[]>([]);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const getProfileConfig = (store: any): any => ((getActiveServerProfile(store as any) as any)?.config || createDefaultConfig());
    const isMainUrlRequiredForMode = (mode: string) => !['remove', 'remove-tunnel'].includes(mode);
    const getActiveProvidersFromConfig = (currentConfig: any) => Object.fromEntries(
        Object.entries(PROVIDER_FLAG_FIELDS).map(([providerKey, configField]) => [providerKey, !!currentConfig?.[configField]])
    );
    const applyProfileStore = (nextStore: any, options?: { resetProviders?: boolean; resetServerState?: boolean }) => {
        setProfileStore(nextStore);
        setActiveProviders(options?.resetProviders ? {} : getActiveProvidersFromConfig(getProfileConfig(nextStore)));
        if (options?.resetServerState ?? true) {
            setScanResults(null);
            setConnectionStatus(null);
        }
    };

    // UI State for expanding/collapsing Provider profiles
    const [activeProviders, setActiveProviders] = useState<Record<string, boolean>>({});

    const getMainUrlError = (currentConfig: any) => {
        const mainUrl = (currentConfig?.MAIN_URL || '').toString().trim();
        if (!mainUrl) {
            return 'MAIN_URL is required. Use your stable public hostname (for example: https://app.example.com).';
        }
        if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/.test(mainUrl)) {
            return 'MAIN_URL must be a valid URL starting with http:// or https://.';
        }
        return '';
    };

    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.loadAppConfig('postiz').then((data: any) => {
                const store = createServerProfileStore(data || {}, createDefaultConfig);
                const normalized = {
                    ...store,
                    serverProfiles: store.serverProfiles.map((profile: any) => {
                        const loadedConfig = profile.config || {};
                        const normalizedConfig = {
                            ...createDefaultConfig(),
                            ...loadedConfig,
                            JWT_SECRET: loadedConfig.JWT_SECRET || createDefaultConfig().JWT_SECRET,
                            STORAGE_PROVIDER: loadedConfig.STORAGE_PROVIDER || 'local',
                            UPLOAD_DIRECTORY: loadedConfig.UPLOAD_DIRECTORY || '/uploads',
                            NEXT_PUBLIC_UPLOAD_DIRECTORY: loadedConfig.NEXT_PUBLIC_UPLOAD_DIRECTORY || '/uploads',
                            POSTIZ_PORT: loadedConfig.POSTIZ_PORT || '4007',
                            POSTIZ_IMAGE: loadedConfig.POSTIZ_IMAGE || 'ghcr.io/gitroomhq/postiz-app:latest'
                        };
                        return { ...profile, config: normalizedConfig };
                    })
                };

                setProfileStore(normalized);

                const activeConfig: any = getProfileConfig(normalized);
                if (activeConfig) {
                    setActiveProviders(getActiveProvidersFromConfig(activeConfig));
                }
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
        setActivityHistory(getProfileActivityHistory('postiz', profileId, 12));
    }, [profileStore.activeServerProfileId]);

    const pushActivity = (action: string, status: 'success' | 'error' | 'info', message: string) => {
        const currentProfile = getActiveServerProfile(profileStore as any) as any;
        if (!currentProfile?.id) return;
        recordActivity({
            appId: 'postiz',
            profileId: currentProfile.id,
            profileName: currentProfile.name || 'Server',
            action,
            status,
            message
        });
        setActivityHistory(getProfileActivityHistory('postiz', currentProfile.id, 12));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newConfig = { ...config, [e.target.name]: e.target.value };

        // Auto-assign routing variables based on the MAIN_URL
        if (e.target.name === 'MAIN_URL') {
            const base = e.target.value.replace(/\/+$/, ''); // Strip trailing slashes
            newConfig = {
                ...newConfig,
                MAIN_URL: base,
                FRONTEND_URL: base,
                NEXT_PUBLIC_BACKEND_URL: base ? `${base}/api` : ''
            };
        }

        setProfileStore((prev: any) => updateActiveServerProfile(prev, newConfig));
        setHasUnsavedChanges(true);
    };

    const toggleProvider = (providerKey: string) => {
        setActiveProviders(prev => ({
            ...prev,
            [providerKey]: !prev[providerKey]
        }));
    };

    const handleSave = async (options?: { skipMainUrlValidation?: boolean }) => {
        if (!window.electronAPI) return;
        const mainUrlError = options?.skipMainUrlValidation ? '' : getMainUrlError(config);
        if (mainUrlError) {
            setLog(prev => [...prev, `ERROR: ${mainUrlError}`]);
            return false;
        }
        setIsSaving(true);
        setLog(prev => [...prev, `--- Saving Postiz profile: ${activeProfileName} ---`]);
        await window.electronAPI.saveAppConfig('postiz', profileStore);
        pushActivity('Save Config', 'success', 'Profile configuration saved.');
        setHasUnsavedChanges(false);
        setTimeout(() => setIsSaving(false), 500);
        return true;
    };

    const handleDeploy = async () => {
        if (!window.electronAPI) return;
        const skipMainUrlValidation = !isMainUrlRequiredForMode(deployMode);
        const activityAction = deployMode === 'remove'
            ? 'Remove Postiz'
            : deployMode === 'remove-tunnel'
                ? 'Remove Tunnel'
                : deployMode === 'tunnel'
                    ? 'Reset Tunnel'
                    : deployMode === 'full'
                        ? 'Fresh Install'
                        : 'Update Core';
        const mainUrlError = skipMainUrlValidation ? '' : getMainUrlError(config);
        if (mainUrlError) {
            setLog(prev => [...prev, `ERROR: ${mainUrlError}`]);
            return;
        }
        if (hasUnsavedChanges) {
            const didSave = await handleSave({ skipMainUrlValidation });
            if (!didSave) return;
        }
        setIsDeploying(true);
        setLog([`--- Starting Postiz ${deployMode} for profile: ${activeProfileName} ---`]);
        const result = await window.electronAPI.deployServer(config, deployMode);
        setIsDeploying(false);
        if (result?.success === false) {
            pushActivity(activityAction, 'error', result.error || `${activityAction} failed.`);
        } else {
            const successMessage = deployMode === 'remove'
                ? 'Postiz removal started successfully.'
                : deployMode === 'remove-tunnel'
                    ? 'Cloudflare tunnel removal started successfully.'
                    : deployMode === 'tunnel'
                        ? 'Cloudflare tunnel reset started successfully.'
                        : deployMode === 'full'
                            ? 'Fresh Postiz installation started successfully.'
                            : 'Core update started successfully.';
            pushActivity(activityAction, 'success', successMessage);
        }
    };

    const handleFetchLogs = async () => {
        if (!window.electronAPI) return;
        setIsFetchingLogs(true);
        setLog([`--- Fetching Docker logs for profile: ${activeProfileName} ---`]);
        const result = await window.electronAPI.fetchLogs(config);
        setIsFetchingLogs(false);
        if (result?.success === false) {
            pushActivity('Sync Logs', 'error', result.error || 'Log sync failed.');
        } else {
            pushActivity('Sync Logs', 'success', 'Container logs fetched.');
        }
    };

    const handleCreateUser = async () => {
        if (!window.electronAPI || !newUserEmail.trim() || !newUserName.trim() || !newUserPassword.trim()) return;
        setIsCreatingUser(true);
        setLog([`--- Creating user on profile ${activeProfileName}: ${newUserName} (${newUserEmail}) ---`]);
        await window.electronAPI.createUser(config, newUserName.trim(), newUserEmail.trim(), newUserPassword.trim());
        setIsCreatingUser(false);
        pushActivity('Create User', 'success', `Created user ${newUserEmail.trim()}.`);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
    };

    const handleSelectProfile = (profileId: string) => {
        const nextStore = selectServerProfile(profileStore, profileId);
        applyProfileStore(nextStore);
    };

    const handleCreateProfile = (name: string) => {
        const nextStore = addServerProfile(profileStore, name, createDefaultConfig);
        applyProfileStore(nextStore, { resetProviders: true });
        setHasUnsavedChanges(true);
    };

    const handleDeleteProfile = (profileId: string) => {
        const nextStore = removeServerProfile(profileStore, profileId);
        applyProfileStore(nextStore);
        setHasUnsavedChanges(true);
    };

    const handleRenameProfile = (profileId: string, newName: string) => {
        setProfileStore((prev: any) => renameServerProfile(prev, profileId, newName));
        setHasUnsavedChanges(true);
    };

    const handleDuplicateProfile = (profileId: string, newName: string) => {
        const nextStore = duplicateServerProfile(profileStore, profileId, newName);
        applyProfileStore(nextStore);
        setHasUnsavedChanges(true);
    };

    const handleExportProfile = () => {
        const blob = new Blob(
            [JSON.stringify({ profileName: activeProfileName, app: 'postiz', config }, null, 2)],
            { type: 'application/json' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeProfileName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-postiz-config.json`;
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
        applyProfileStore(nextStore);
        setHasUnsavedChanges(true);
        if (importedProfile?.id) {
            recordActivity({
                appId: 'postiz',
                profileId: importedProfile.id,
                profileName: importedProfile.name || importedName,
                action: 'Import Config',
                status: 'success',
                message: `Profile "${importedName}" imported from JSON.`
            });
            setActivityHistory(getProfileActivityHistory('postiz', importedProfile.id, 12));
        }
    };

    const handleClearHistory = () => {
        const currentProfile = getActiveServerProfile(profileStore as any) as any;
        if (!currentProfile?.id) return;
        clearProfileHistory('postiz', currentProfile.id);
        setActivityHistory([]);
    };

    const handleTestConnection = async () => {
        if (!window.electronAPI) return;
        if (!config.serverHost || !config.serverUser || !config.serverPassword) {
            setLog(prev => [...prev, 'ERROR: Server host, user and password are required to test the connection.']);
            return;
        }

        setIsTestingConnection(true);
        setLog(prev => [...prev, `--- Testing Postiz connection: ${activeProfileName} ---`]);
        const result = await window.electronAPI.testServerConnection(config, {
            configuredPort: parseInt((config.POSTIZ_PORT || '4007').toString(), 10) || 4007
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

    const handleScan = async () => {
        if (!window.electronAPI) return;
        if (!config.serverHost || !config.serverUser || !config.serverPassword) {
            setLog(prev => [...prev, 'ERROR: Server host, user and password are required to scan.']);
            return;
        }
        setIsScanning(true);
        setLog(prev => [...prev, `--- Scanning Postiz server: ${activeProfileName} ---`]);
        const result = await (window.electronAPI as any).scanPostizServer(config);
        setIsScanning(false);

        if (result.success) {
            if (result.remoteEnv && Object.keys(result.remoteEnv).length > 0) {
                const syncKeys = [
                    "X_API_KEY", "X_API_SECRET", "LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET",
                    "FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET", "INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET",
                    "YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "TIKTOK_CLIENT_ID", "TIKTOK_CLIENT_SECRET",
                    "PINTEREST_CLIENT_ID", "PINTEREST_CLIENT_SECRET", "DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET", 
                    "DISCORD_BOT_TOKEN_ID", "REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "GITHUB_CLIENT_ID", 
                    "GITHUB_CLIENT_SECRET", "MASTODON_URL", "MASTODON_CLIENT_ID", "MASTODON_CLIENT_SECRET",
                    "THREADS_APP_ID", "THREADS_APP_SECRET", "BEEHIIVE_API_KEY", "BEEHIIVE_PUBLICATION_ID",
                    "DRIBBBLE_CLIENT_ID", "DRIBBBLE_CLIENT_SECRET", "SLACK_ID", "SLACK_SECRET", "SLACK_SIGNING_SECRET",
                    "OPENAI_API_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY", "STRIPE_SIGNING_KEY", 
                    "STRIPE_SIGNING_KEY_CONNECT", "NEXT_PUBLIC_DISCORD_SUPPORT", "NEXT_PUBLIC_POLOTNO"
                ];
                
                setProfileStore((prev: any) => {
                    const currentProfile = getActiveServerProfile(prev as any) as any;
                    if (!currentProfile) return prev;
                    
                    const updatedConfig = { ...currentProfile.config };
                    let keysUpdated = 0;
                    
                    syncKeys.forEach(field => {
                        const val = result.remoteEnv[field];
                        if (val !== undefined && val !== "undefined" && val !== "null") {
                            if (updatedConfig[field] !== val) {
                                updatedConfig[field] = val;
                                keysUpdated++;
                            }
                        }
                    });
                    
                    setActiveProviders(getActiveProvidersFromConfig(updatedConfig));
                    
                    if (keysUpdated > 0) {
                        setTimeout(() => {
                            setLog(logPrev => [...logPrev, `✓ Imported ${keysUpdated} configuration keys from remote server.`]);
                            setHasUnsavedChanges(true);
                        }, 100);
                    }
                    
                    return updateActiveServerProfile(prev, updatedConfig);
                });
            }

            setScanResults(result);
            setConnectionStatus({ success: true, serverHealth: result.serverHealth });
            pushActivity('Sync Server', 'success', 'Server state synchronized successfully.');
            if (!result.dockerInstalled) {
                setLog(prev => [...prev, 'Docker is not installed on this server.']);
            } else {
                const running = Object.entries(result.containers || {})
                    .filter(([, info]: any) => info.status === 'running')
                    .map(([name]) => name);
                if (running.length) {
                    setLog(prev => [...prev, `Running services: ${running.join(', ')}`]);
                } else {
                    setLog(prev => [...prev, 'No Postiz services are currently running.']);
                }
                const cfState = result.cloudflareStatus === 'active' ? 'Active' : 'Inactive';
                setLog(prev => [...prev, `Cloudflare Tunnel: ${cfState}`]);
            }
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
        isFetchingLogs,
        isScanning,
        isTestingConnection,
        isCreatingUser,
        newUserName,
        setNewUserName,
        newUserEmail,
        setNewUserEmail,
        newUserPassword,
        setNewUserPassword,
        hasUnsavedChanges,
        scanResults,
        connectionStatus,
        activityHistory,
        serverHealth: connectionStatus?.serverHealth || scanResults?.serverHealth || null,
        activeProfileName,
        mainUrlError: isMainUrlRequiredForMode(deployMode) ? getMainUrlError(config) : '',
        activeProviders,
        handleChange,
        handleSelectProfile,
        handleCreateProfile,
        handleDeleteProfile,
        toggleProvider,
        handleSave,
        handleDeploy,
        handleFetchLogs,
        handleTestConnection,
        handleScan,
        handleCreateUser,
        handleRenameProfile,
        handleDuplicateProfile,
        handleExportProfile,
        handleImportProfile,
        handleClearHistory
    };
};
