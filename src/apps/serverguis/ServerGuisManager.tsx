import { useState } from 'react';
import { Terminal, Loader2, Save, ArrowLeft, MonitorPlay, Info, Server, ShieldCheck, RefreshCw, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import { useServerGuisLogic } from './hooks/useServerGuisLogic';
import { ServerProfileManager } from '../../components/ServerProfileManager';
import { ServerHealthPanel } from '../../components/ServerHealthPanel';
import { ActivityHistoryPanel } from '../../components/ActivityHistoryPanel';
import { FormGroup } from '../../components/FormGroup';
import { guiOptionsFull, guiTypes } from './guiOptionsFull';
import { guiScripts } from './guiScripts';

export default function ServerGuisManager({ onBack }: { onBack: () => void }) {
    const [showDeployPreview, setShowDeployPreview] = useState(false);
    
    const deployModeLabels: Record<string, string> = {
        deploy: 'Install GUI',
        remove: 'Remove GUI'
    };

    const {
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
    } = useServerGuisLogic() as any;

    const [language, setLanguage] = useState<'en' | 'es'>('en');
    const [selectedType, setSelectedType] = useState<string>('minimal');

    const lastSyncedAt = serverHealth?.checkedAt
        ? new Date(serverHealth.checkedAt).toLocaleString(undefined, {
            month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
        }) : null;

    const deployActionLabel = deployModeLabels[deployMode] || 'Deploy GUI';
    
    const detectedOS = scanResults?.detectedOS || 'unknown';
    const installedGui = scanResults?.installedGui || 'none';
    const guiState = scanResults?.guiState || 'inactive';

    // Allow user to manually select OS if detection fails, but default to detectedOS
    const activeOS = detectedOS !== 'unknown' ? detectedOS : (config.manualOs || 'ubuntu');

    const filteredGUIs = guiOptionsFull.filter(
        gui => (gui.os.includes(activeOS) || activeOS === 'other' || activeOS === 'unknown') && gui.type === selectedType
    );

    const openDeployPreview = () => {
        if (isDeploying || !config.serverHost) return;
        if (deployMode === 'deploy' && !config.selectedGui) return;
        setShowDeployPreview(true);
    };

    const confirmDeploy = async () => {
        setShowDeployPreview(false);
        const scriptData = deployMode === 'deploy' && config.selectedGui ? (guiScripts as any)[config.selectedGui] : null;
        let script = null;
        if (scriptData) {
            script = scriptData[language] || scriptData['en'];
        }
        await handleDeploy(config.selectedGui, script);
    };

    const isGuiInstalled = installedGui !== 'none';

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 lg:p-16 overflow-x-hidden selection:bg-cyan-500/30">

            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[20%] left-[-5%] w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[120px]"></div>
            </div>

            {/* Top Navigation */}
            <div className="max-w-[1700px] mx-auto flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between bg-slate-900/60 backdrop-blur-2xl border border-white/5 px-6 md:px-8 py-6 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] mb-12 sticky top-6 z-50">
                <div className="flex items-center gap-4 md:gap-6 min-w-0">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-slate-400 hover:text-white group/back"
                        title="Back to App Selection"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Return</span>
                    </button>

                    <div className="h-10 w-px bg-white/5 hidden md:block"></div>

                    <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-3 rounded-2xl shadow-2xl shadow-cyan-500/20 ring-1 ring-white/20">
                            <MonitorPlay className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                                Server <span className="text-cyan-400">GUIs</span>
                            </h1>
                            <p className="text-[10px] text-slate-500 font-black tracking-[0.2em] uppercase">Desktop Environment Provisioner</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:gap-4 xl:justify-end">
                    <button
                        onClick={handleTestConnection}
                        disabled={isTestingConnection || isDeploying || !config.serverHost}
                        className="flex items-center px-6 h-14 font-black rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest text-[11px]"
                    >
                        {isTestingConnection ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Testing</> : <><RefreshCw className="w-4 h-4 mr-2" />Test Connection</>}
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSaving || !hasUnsavedChanges}
                        className={`flex items-center px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] transition-all duration-500 border ${hasUnsavedChanges
                            ? 'bg-cyan-600/10 text-cyan-400 hover:bg-cyan-600/20 border-cyan-500/30'
                            : 'bg-white/5 text-slate-600 cursor-not-allowed border-white/5'
                            }`}
                    >
                        {isSaving ? (
                            <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Syncing</>
                        ) : (
                            <><Save className="w-3.5 h-3.5 md:mr-2" /> <span className="hidden md:inline">Save Config</span></>
                        )}
                    </button>

                    <div className="flex bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden h-14">
                        <div className="relative flex items-center border-r border-white/5 h-full">
                            <select
                                value={deployMode}
                                onChange={(e) => setDeployMode(e.target.value)}
                                disabled={isDeploying || (deployMode === 'remove' && !isGuiInstalled)}
                                className="bg-transparent text-slate-300 h-full pl-5 pr-12 font-black text-[10px] uppercase tracking-widest focus:outline-none appearance-none cursor-pointer hover:bg-white/5 transition-colors"
                            >
                                <option value="deploy" className="bg-slate-950">Install GUI</option>
                                <option value="remove" className="bg-slate-950" disabled={!isGuiInstalled}>Remove GUI</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-600 absolute right-5 pointer-events-none" />
                        </div>
                        <button
                            onClick={openDeployPreview}
                            disabled={isDeploying || !config.serverHost || (deployMode === 'deploy' && !config.selectedGui)}
                            className="flex items-center px-8 h-full font-black rounded-r-2xl bg-gradient-to-b from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white shadow-2xl shadow-cyan-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all uppercase tracking-widest text-[11px] italic"
                        >
                            {isDeploying ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Active</>
                            ) : (
                                <><Server className="w-4 h-4 mr-2" /> {deployActionLabel}</>
                            )}
                        </button>
                    </div>

                    <button
                        onClick={handleScan}
                        disabled={isScanning || isDeploying || !config.serverHost}
                        className="flex items-center px-6 h-14 font-black rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest text-[11px]"
                    >
                        {isScanning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Syncing</> : <><RefreshCw className="w-4 h-4 mr-2" />Sync Server</>}
                    </button>

                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border whitespace-nowrap ${scanResults?.success ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-white/10 bg-white/5'}`}>
                        {scanResults?.success ? `Last Sync: ${lastSyncedAt}` : 'Last Sync: Never'}
                    </span>
                </div>
            </div>

            <div className="max-w-[1700px] mx-auto grid grid-cols-1 2xl:grid-cols-12 gap-12 relative z-10">

                {/* Left Side: Forms */}
                <div className="2xl:col-span-8">

                    <ServerProfileManager
                        profiles={profiles}
                        activeProfileId={activeProfileId}
                        onSelectProfile={handleSelectProfile}
                        onCreateProfile={handleCreateProfile}
                        onDeleteProfile={handleDeleteProfile}
                        onRenameProfile={handleRenameProfile}
                        onDuplicateProfile={handleDuplicateProfile}
                        onExportProfile={handleExportProfile}
                        onImportProfile={handleImportProfile}
                        expectedAppId="serverguis"
                        accentClassName="text-cyan-400 border-cyan-500/20 bg-cyan-500/10"
                    />

                    <ServerHealthPanel
                        health={serverHealth}
                        title="Server Health"
                        accentClassName="text-cyan-400 border-cyan-500/20 bg-cyan-500/10"
                    />

                    <ActivityHistoryPanel
                        items={activityHistory}
                        title="Recent Activity"
                        accentClassName="text-cyan-400 border-cyan-500/20 bg-cyan-500/10"
                        onClearHistory={handleClearHistory}
                    />

                    {/* Welcome Banner */}
                    <div className="mb-12">
                        <div className="bg-cyan-600/10 backdrop-blur-xl border border-cyan-500/20 rounded-[2rem] p-8 flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-6 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="bg-cyan-600/20 p-4 rounded-2xl border border-cyan-400/30 ring-4 ring-cyan-500/5 group-hover:scale-110 transition-transform duration-500 shrink-0">
                                <Info className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-white tracking-tight uppercase italic mb-2">Automated Desktop Provisioning</h4>
                                <p className="text-slate-400 text-sm leading-relaxed font-medium mb-4">
                                    Transform headless Linux servers into fully functional remote desktops. We auto-detect your OS and configure <strong>xRDP</strong> automatically so you can connect seamlessly via Microsoft Remote Desktop.
                                </p>
                                <div className="flex gap-4 items-center">
                                     <div className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2">
                                          Install GUIs
                                     </div>
                                     <div className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2">
                                          Remove GUIs
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 md:p-8 mb-8">
                        <h3 className="text-white font-black uppercase tracking-widest text-xs mb-6">Server Connection</h3>
                        <div className="space-y-4">
                            <FormGroup label="Server IP Address" name="serverHost" placeholder="192.168.1.100" value={config.serverHost} onChange={handleChange} />
                            <FormGroup label="SSH Username" name="serverUser" placeholder="root" value={config.serverUser} onChange={handleChange} />
                            <FormGroup label="SSH Password" name="serverPassword" type="password" placeholder="••••••" value={config.serverPassword} onChange={handleChange} />
                        </div>
                    </div>

                    {scanResults?.success && (
                        <div className="mb-8 bg-slate-900/50 border border-white/10 rounded-[2rem] p-6 md:p-8">
                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-4">Server State Analysis</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="flex items-center justify-between border border-white/5 rounded-xl px-4 py-3 bg-black/20">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Detected OS</span>
                                    <span className="text-white font-black uppercase">{detectedOS}</span>
                                </div>
                                <div className="flex items-center justify-between border border-white/5 rounded-xl px-4 py-3 bg-black/20">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">GUI Installed</span>
                                    <span className={`font-black uppercase ${isGuiInstalled ? 'text-amber-400' : 'text-slate-500'}`}>
                                        {installedGui}
                                    </span>
                                </div>
                                {isGuiInstalled && (
                                    <div className="flex items-center justify-between border border-emerald-500/20 rounded-xl px-4 py-3 bg-emerald-500/5 md:col-span-2">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                            <span className="text-emerald-300 font-semibold">Existing Graphical Environment Detected</span>
                                        </div>
                                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-200 rounded text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                                            {guiState}
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            {isGuiInstalled && (
                                <div className="mt-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                                    <p className="text-xs text-amber-200 leading-relaxed font-medium">
                                        A GUI is currently installed (`{installedGui}`). To install a different one safely, switch the top right deploy action to <strong>Remove GUI</strong> first to clean up existing display managers and revert to a headless state.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {!scanResults?.success && (
                         <div className="mb-8 p-6 border border-blue-500/20 bg-blue-500/5 rounded-[2rem] flex flex-col items-center justify-center text-center">
                              <RefreshCw className="w-8 h-8 text-blue-400 mb-3 opacity-50" />
                              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Awaiting Server Sync</h3>
                              <p className="text-xs text-slate-400 max-w-md">Click "Sync Server" to auto-detect the operating system. We will then show you the graphical interfaces compatible with your server.</p>
                         </div>
                    )}


                    {scanResults?.success && (
                        <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 md:p-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-white/5 pb-6">
                                <div>
                                    <h3 className="text-white font-black uppercase tracking-widest text-xs">GUI Selection</h3>
                                    <p className="text-[10px] text-slate-500 mt-1">Available graphical interfaces for {detectedOS.toUpperCase()}</p>
                                </div>
                                
                                <div className="flex gap-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Type</span>
                                        <select 
                                            value={selectedType}
                                            onChange={(e) => setSelectedType(e.target.value)}
                                            className="bg-black/30 border border-white/10 rounded-lg text-xs text-white px-3 py-1.5 outline-none"
                                        >
                                            {guiTypes.map(t => <option key={t.id} value={t.id}>{language === 'en' ? t.en : t.es}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Language</span>
                                        <select 
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
                                            className="bg-black/30 border border-white/10 rounded-lg text-xs text-white px-3 py-1.5 outline-none"
                                        >
                                            <option value="en">English Script</option>
                                            <option value="es">Script en Español</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredGUIs.map(gui => (
                                    <div 
                                        key={gui.id}
                                        onClick={() => handleTextChange('selectedGui', gui.id)}
                                        className={`cursor-pointer border rounded-2xl p-4 transition-all duration-300 ${config.selectedGui === gui.id 
                                            ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)] ring-1 ring-cyan-400/50' 
                                            : 'bg-black/20 border-white/5 hover:border-white/20 hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className={`font-black text-sm uppercase tracking-wider ${config.selectedGui === gui.id ? 'text-cyan-300' : 'text-slate-200'}`}>
                                                {gui.name[language] || gui.name['en']}
                                            </h4>
                                            {config.selectedGui === gui.id && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                            {gui.description[language] || gui.description['en']}
                                        </p>
                                    </div>
                                ))}
                                {filteredGUIs.length === 0 && (
                                    <div className="col-span-1 md:col-span-2 p-8 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                                        <XCircle className="w-8 h-8 text-slate-600 mb-3" />
                                        <p className="text-slate-400 text-sm font-bold">No {selectedType} GUIs found for {activeOS}.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side: Terminal */}
                <div className="2xl:col-span-4 space-y-8">
                    {/* High-Tech Terminal */}
                    <div className="sticky top-[140px] bg-slate-950/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.8)] flex flex-col h-[calc(100vh-180px)] overflow-hidden ring-1 ring-white/5">
                        <div className="bg-slate-900/50 border-b border-white/5 flex items-center justify-between p-6 z-10">
                            <h2 className="text-[10px] font-black flex items-center text-slate-400 tracking-[0.3em] uppercase italic">
                                <Terminal className="w-4 h-4 mr-3 text-cyan-500" />
                                Deployment Terminal
                            </h2>
                            {isDeploying && <div className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                            </div>}
                        </div>

                        <div className="flex-1 bg-black/40 p-8 overflow-y-auto font-mono text-[12px] leading-[1.8] custom-scrollbar shadow-inner relative">
                            {log.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-800">
                                    <Terminal className="w-16 h-16 mb-6 opacity-5" />
                                    <p className="italic font-bold uppercase tracking-widest opacity-20">Idle Console - Standby</p>
                                </div>
                            ) : (
                                <div className="space-y-1 pb-12">
                                    {log.map((line: string, i: number) => (
                                        <div key={i} className="flex gap-4 group/line">
                                            <span className="text-slate-800 font-black select-none shrink-0 w-8 group-hover/line:text-cyan-900 transition-colors">{String(i + 1).padStart(3, '0')}</span>
                                            <span className={`${line.includes('ERROR') ? 'text-rose-400 font-bold bg-rose-500/5 px-2 rounded' : 'text-slate-400'} break-words whitespace-pre-wrap`}>
                                                {line}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                        </div>
                    </div>
                </div>

            </div>

            {showDeployPreview && (
                <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm p-4 md:p-6 flex items-center justify-center">
                    <div className="w-full max-w-2xl bg-slate-950 border border-white/10 rounded-[2rem] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                        <div className="px-6 md:px-8 py-5 border-b border-white/10 bg-slate-900/60">
                            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-cyan-400">Pre-Deploy Preview</p>
                            <h3 className="text-white text-xl font-black uppercase italic mt-1">Review Before {deployActionLabel}</h3>
                            <p className="text-xs text-slate-400 mt-1">Profile: <span className="text-slate-200 font-bold">{activeProfileName}</span></p>
                        </div>

                        <div className="px-6 md:px-8 py-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                    <p className="text-slate-500 uppercase tracking-widest font-black text-[10px]">Server</p>
                                    <p className="text-slate-200 font-bold mt-1 break-all">{config.serverHost || 'Not set'}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                    <p className="text-slate-500 uppercase tracking-widest font-black text-[10px]">Action</p>
                                    <p className="text-slate-200 font-bold mt-1 uppercase">{deployActionLabel}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                    <p className="text-slate-500 uppercase tracking-widest font-black text-[10px]">Detected OS</p>
                                    <p className="text-slate-200 font-bold mt-1 uppercase">{detectedOS}</p>
                                </div>
                                {deployMode === 'deploy' && (
                                    <div className="rounded-xl border border-white/10 bg-cyan-500/10 p-3">
                                        <p className="text-cyan-500 uppercase tracking-widest font-black text-[10px]">Selected GUI</p>
                                        <p className="text-cyan-300 font-bold mt-1 uppercase">{config.selectedGui}</p>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                    Action Summary
                                </p>
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    {deployMode === 'remove' 
                                        ? `This will aggressively remove existing GUI packages (${installedGui || 'found active'}) and reset the server boot mode to headless multi-user target.` 
                                        : `This will execute the installation script for ${config.selectedGui} and configure remote desktop access (xRDP) via port 3389. The server will reboot automatically when finished.`}
                                </p>
                            </div>

                            {hasUnsavedChanges && (
                                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-200">
                                    Unsaved changes detected. This action will save profile settings before executing.
                                </div>
                            )}
                        </div>

                        <div className="px-6 md:px-8 py-4 border-t border-white/10 bg-slate-900/40 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowDeployPreview(false)}
                                className="px-5 h-11 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-black uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeploy}
                                disabled={isDeploying || !config.serverHost}
                                className="px-6 h-11 rounded-xl bg-gradient-to-b from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Confirm {deployActionLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(6, 182, 212, 0.3);
                }
            `}} />
        </div>
    );
}
