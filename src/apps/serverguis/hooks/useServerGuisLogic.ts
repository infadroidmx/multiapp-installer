import { useState, useEffect } from 'react';

export function useServerGuisLogic() {
    const [config, setConfig] = useState<any>({});
    const [log, setLog] = useState<string[]>([]);
    const [deployMode, setDeployMode] = useState('deploy');
    const [isDeploying, setIsDeploying] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [activityHistory, setActivityHistory] = useState<any[]>([]);

    const [profiles, setProfiles] = useState<any[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
    const activeProfileName = profiles.find(p => p.id === activeProfileId)?.name || 'Default Profile';

    const [scanResults, setScanResults] = useState<any>(null);
    const [serverHealth, setServerHealth] = useState<any>(null);

    // Initial load
    useEffect(() => {
        const loadInitial = async () => {
            const electron = (window as any).electronAPI;
            if (electron?.loadAppConfig) {
                const profilesData = await electron.loadAppConfig('serverProfiles');
                if (profilesData && Array.isArray(profilesData)) {
                    setProfiles(profilesData);
                    const lastActive = profilesData.find(p => p.lastUsed && p.appId === 'serverguis');
                    if (lastActive) {
                        setActiveProfileId(lastActive.id);
                        setConfig(lastActive.config || {});
                    } else {
                        const firstServerGuis = profilesData.find(p => p.appId === 'serverguis');
                        if (firstServerGuis) {
                            setActiveProfileId(firstServerGuis.id);
                            setConfig(firstServerGuis.config || {});
                        }
                    }
                }
            }

            if (electron?.loadAppConfig) {
                const history = await electron.loadAppConfig('serverguis_activityHistory');
                if (history && Array.isArray(history)) {
                    setActivityHistory(history);
                }
            }

            if (electron?.onLogMessage) {
                electron.onLogMessage((msg: string) => {
                    setLog(prev => [...prev, msg].slice(-1000));
                });
            }
        };
        loadInitial();
    }, []);

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setConfig((prev: any) => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 'true' : 'false') : value
        }));
        setHasUnsavedChanges(true);
    };

    const handleTextChange = (name: string, value: string) => {
        setConfig((prev: any) => ({ ...prev, [name]: value }));
        setHasUnsavedChanges(true);
    };

    const handleSelectProfile = (id: string, profileConfig: any) => {
        setActiveProfileId(id);
        setConfig(profileConfig || {});
        setHasUnsavedChanges(false);
        setScanResults(null); 
    };

    const handleUpdateProfiles = async (newProfiles: any[]) => {
        setProfiles(newProfiles);
        const electron = (window as any).electronAPI;
        if (electron?.saveAppConfig) {
            await electron.saveAppConfig('serverProfiles', newProfiles);
        }
    };

    const handleCreateProfile = (name: string) => {
        const newProfile = {
            id: Date.now().toString(),
            name,
            appId: 'serverguis',
            config: {},
            createdAt: new Date().toISOString(),
            lastUsed: new Date().toISOString()
        };
        const updated = [...profiles, newProfile];
        handleUpdateProfiles(updated);
        handleSelectProfile(newProfile.id, newProfile.config);
    };

    const handleDeleteProfile = (id: string) => {
        const updated = profiles.filter(p => p.id !== id);
        handleUpdateProfiles(updated);
        if (activeProfileId === id) {
            setActiveProfileId(null);
            setConfig({});
        }
    };

    const handleRenameProfile = (id: string, newName: string) => {
      const updated = profiles.map(p => p.id === id ? { ...p, name: newName } : p);
      handleUpdateProfiles(updated);
    };

    const handleDuplicateProfile = (id: string) => {
      const original = profiles.find(p => p.id === id);
      if (!original) return;
      const copy = {
          ...original,
          id: Date.now().toString(),
          name: `${original.name} (Copy)`,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString()
      };
      const updated = [...profiles, copy];
      handleUpdateProfiles(updated);
      handleSelectProfile(copy.id, copy.config);
    };

    const handleExportProfile = (id: string) => {
      const profile = profiles.find(p => p.id === id);
      if (!profile) return;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", `${profile.name.replace(/\s+/g, '_')}_profile.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    };

    const handleImportProfile = (importedProfile: any) => {
      const newProfile = {
          ...importedProfile,
          id: Date.now().toString(),
          appId: 'serverguis',
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString()
      };
      const updated = [...profiles, newProfile];
      handleUpdateProfiles(updated);
      handleSelectProfile(newProfile.id, newProfile.config);
    };

    const handleClearHistory = async () => {
        setActivityHistory([]);
        const electron = (window as any).electronAPI;
        if (electron?.saveAppConfig) {
            await electron.saveAppConfig('serverguis_activityHistory', []);
        }
    };

    const logActivity = async (action: string, status: 'success' | 'error', details: string) => {
        const newItem = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            action,
            status,
            details,
            profileName: activeProfileName
        };
        const updated = [newItem, ...activityHistory].slice(0, 50);
        setActivityHistory(updated);
        const electron = (window as any).electronAPI;
        if (electron?.saveAppConfig) {
            await electron.saveAppConfig('serverguis_activityHistory', updated);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const electron = (window as any).electronAPI;
            if (activeProfileId && electron?.saveAppConfig) {
                const updatedProfiles = profiles.map(p => {
                    if (p.id === activeProfileId) {
                        return { ...p, config, lastUsed: new Date().toISOString() };
                    }
                    if (p.appId === 'serverguis') {
                        return { ...p, lastUsed: undefined };
                    }
                    return p;
                });
                await electron.saveAppConfig('serverProfiles', updatedProfiles);
                setProfiles(updatedProfiles);
            }
            setHasUnsavedChanges(false);
            setLog(prev => [...prev, 'Configuration saved locally.']);
        } catch (error: any) {
            setLog(prev => [...prev, `ERROR: Failed to save config: ${error.message}`]);
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestConnection = async () => {
        setIsTestingConnection(true);
        setLog(prev => [...prev, 'Testing SSH connection...']);
        try {
            const electron = (window as any).electronAPI;
            const res = await electron.testServerConnection(config);
            if (res.success) {
                setLog(prev => [...prev, `Connection successful! OS: ${res.os}`]);
                logActivity('Test Connection', 'success', 'Verified SSH access.');
            } else {
                setLog(prev => [...prev, `ERROR: Connection failed: ${res.error}`]);
                logActivity('Test Connection', 'error', res.error || 'Connection failed');
            }
        } catch (error: any) {
            setLog(prev => [...prev, `ERROR: ${error.message}`]);
            logActivity('Test Connection', 'error', error.message);
        } finally {
            setIsTestingConnection(false);
        }
    };

    const handleScan = async () => {
        if (!config.serverHost) {
            setLog(prev => [...prev, 'ERROR: Server Host is required for scanning.']);
            return;
        }

        setIsScanning(true);
        setLog(prev => [...prev, `Scanning ${config.serverHost} for OS and GUI installations...`]);
        setScanResults(null); 

        try {
            const electron = (window as any).electronAPI;
            setLog(prev => [...prev, 'Collecting system metrics and OS detection...']);
            
            const res = await electron.scanServerGuis(config);
            
            if (res.success) {
                setScanResults(res);
                setServerHealth(res.serverHealth);

                let guiMsg = 'No GUI detected.';
                if (res.installedGui !== 'none') {
                     guiMsg = `Detected GUI: ${res.installedGui} (${res.guiState})`;
                }

                setLog(prev => [...prev, `Detected OS: ${res.detectedOS}`, guiMsg, 'Scan complete.']);
                logActivity('Sync Server', 'success', `Detected OS: ${res.detectedOS}`);
            } else {
                setLog(prev => [...prev, `ERROR: Scan failed - ${res.error}`]);
                logActivity('Sync Server', 'error', res.error || 'Scan failed');
            }
        } catch (error: any) {
            setLog(prev => [...prev, `ERROR: ${error.message}`]);
            logActivity('Sync Server', 'error', error.message);
        } finally {
            setIsScanning(false);
        }
    };

    const handleDeploy = async (selectedGui: string, installScript: string) => {
        if (!config.serverHost) {
            setLog(prev => [...prev, 'ERROR: Server Host is required for deployment.']);
            return;
        }

        if (hasUnsavedChanges) {
            await handleSave();
        }

        setIsDeploying(true);
        setLog([]);
        setLog(prev => [...prev, `Starting ${deployMode === 'deploy' ? 'installation' : 'removal'} on ${config.serverHost}...`]);
        
        try {
            const electron = (window as any).electronAPI;
            const res = await electron.deployServerGuis(config, deployMode, selectedGui, installScript);
            
            if (res.success) {
                setLog(prev => [...prev, `Task completed successfully!`]);
                logActivity(deployMode === 'deploy' ? 'Install GUI' : 'Remove GUI', 'success', `Target: ${selectedGui || 'All GUIs'}`);
                await handleScan(); 
            } else {
                setLog(prev => [...prev, `ERROR: Task failed - ${res.error}`]);
                logActivity(deployMode === 'deploy' ? 'Install GUI' : 'Remove GUI', 'error', res.error || 'Task failed');
            }
        } catch (error: any) {
            setLog(prev => [...prev, `ERROR: ${error.message}`]);
            logActivity(deployMode === 'deploy' ? 'Install GUI' : 'Remove GUI', 'error', error.message);
        } finally {
            setIsDeploying(false);
        }
    };

    return {
        config,
        log,
        deployMode,
        setDeployMode,
        isDeploying,
        isSaving,
        isScanning,
        isTestingConnection,
        hasUnsavedChanges,
        activityHistory,
        profiles,
        activeProfileId,
        activeProfileName,
        scanResults,
        serverHealth,
        handleChange,
        handleTextChange,
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
}
