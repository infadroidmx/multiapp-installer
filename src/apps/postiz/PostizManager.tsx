import { useState } from 'react';
import { Send, Terminal, Loader2, Save, ArrowLeft, ChevronDown, UserPlus, Info, Rocket, Eye, EyeOff, RefreshCw } from 'lucide-react';

import { CoreSettings } from './sections/CoreSettings';
import { DatabaseStorage } from './sections/DatabaseStorage';
import { SocialNetworkAPIs } from './sections/SocialNetworkAPIs';
import { UserAuthentication } from './sections/UserAuthentication';
import { ShortLinkServices } from './sections/ShortLinkServices';
import { PaymentsAndAI } from './sections/PaymentsAndAI';
import { DeveloperSettings } from './sections/DeveloperSettings';
import { ServerProfileManager } from '../../components/ServerProfileManager';
import { ServerHealthPanel } from '../../components/ServerHealthPanel';
import { ActivityHistoryPanel } from '../../components/ActivityHistoryPanel';

import { usePostizLogic } from './hooks/usePostizLogic';

export default function PostizManager({ onBack }: { onBack: () => void }) {
    const [showNewUserPassword, setShowNewUserPassword] = useState(false);
    const [showDeployPreview, setShowDeployPreview] = useState(false);
    const deployModeLabels: Record<string, string> = {
        update: 'Update Core',
        full: 'Fresh Install',
        tunnel: 'Reset Tunnel',
        'remove-tunnel': 'Remove Tunnel',
        remove: 'Remove Postiz'
    };

    const {
        config,
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
        profiles,
        activeProfileId,
        scanResults,
        serverHealth,
        activityHistory,
        activeProfileName,
        mainUrlError,
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
    } = usePostizLogic();

    const postizContainerEntries = Object.entries(scanResults?.containers || {}) as Array<[string, any]>;
    const runningContainerCount = postizContainerEntries.filter(([, info]) => info?.status === 'running').length;
    const installedContainerCount = postizContainerEntries.filter(([, info]) => info?.status && info.status !== 'not_found').length;
    const notFoundContainerCount = postizContainerEntries.filter(([, info]) => info?.status === 'not_found').length;
    const lastSyncedAt = scanResults?.serverHealth?.checkedAt
        ? new Date(scanResults.serverHealth.checkedAt).toLocaleString(undefined, {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
        : null;
    const deployActionLabel = deployModeLabels[deployMode] || 'Deploy';
    const postizActionSummary = deployMode === 'remove'
        ? 'This will remove the Postiz stack, its managed containers, volumes, and deployment directory from the server.'
        : deployMode === 'remove-tunnel'
            ? 'This will remove only the Cloudflare tunnel service. The Postiz stack and data stay intact.'
            : deployMode === 'tunnel'
                ? 'This will reconfigure the Cloudflare tunnel integration without reinstalling the full Postiz stack.'
                : null;

    const openDeployPreview = () => {
        if (isDeploying || !!mainUrlError) return;
        setShowDeployPreview(true);
    };

    const confirmDeploy = async () => {
        setShowDeployPreview(false);
        await handleDeploy();
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 lg:p-16 overflow-x-hidden selection:bg-blue-500/30">

            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[20%] left-[-5%] w-[30%] h-[30%] bg-indigo-600/5 rounded-full blur-[120px]"></div>
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
                        <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-2xl shadow-blue-500/20 ring-1 ring-white/20">
                            <Rocket className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                                Postiz <span className="text-blue-500">Manager</span>
                            </h1>
                            <p className="text-[10px] text-slate-500 font-black tracking-[0.2em] uppercase">Deployment Engine v1.0.4</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:gap-4 xl:justify-end">
                    <button
                        onClick={handleTestConnection}
                        disabled={isTestingConnection || isDeploying || !config.serverHost}
                        className="flex items-center px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] transition-all duration-500 border bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isTestingConnection ? (
                            <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Testing</>
                        ) : (
                            <><RefreshCw className="w-3.5 h-3.5 mr-2" /> Test Connection</>
                        )}
                    </button>

                    <button
                        onClick={handleScan}
                        disabled={isScanning || isDeploying || !config.serverHost}
                        className="flex items-center px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] transition-all duration-500 border bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isScanning ? (
                            <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Syncing</>
                        ) : (
                            <><RefreshCw className="w-3.5 h-3.5 mr-2" /> Sync Server</>
                        )}
                    </button>

                    <button
                        onClick={() => {
                            void handleSave();
                        }}
                        disabled={isSaving || !hasUnsavedChanges}
                        className={`flex items-center px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] transition-all duration-500 border ${hasUnsavedChanges
                            ? 'bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border-blue-500/30'
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
                                disabled={isDeploying}
                                className="bg-transparent text-slate-300 h-full pl-5 pr-12 font-black text-[10px] uppercase tracking-widest focus:outline-none appearance-none cursor-pointer hover:bg-white/5 transition-colors"
                            >
                                <option value="update" className="bg-slate-950">Update Core</option>
                                <option value="full" className="bg-slate-950">Fresh Install</option>
                                <option value="tunnel" className="bg-slate-950">Reset Tunnel</option>
                                <option value="remove-tunnel" className="bg-slate-950">Remove Tunnel</option>
                                <option value="remove" className="bg-slate-950">Remove Postiz</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-600 absolute right-5 pointer-events-none" />
                        </div>
                        <button
                            onClick={openDeployPreview}
                            disabled={isDeploying || !!mainUrlError}
                            className="flex items-center px-8 h-full font-black bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-[11px] italic"
                        >
                            {isDeploying ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Active</>
                            ) : (
                                <><Send className="w-4 h-4 mr-2" /> {deployActionLabel}</>
                            )}
                        </button>
                    </div>
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
                        expectedAppId="postiz"
                        accentClassName="text-blue-400 border-blue-500/20 bg-blue-500/10"
                    />

                    <ServerHealthPanel
                        health={serverHealth}
                        title="Server Health"
                        accentClassName="text-blue-400 border-blue-500/20 bg-blue-500/10"
                    />

                    <ActivityHistoryPanel
                        items={activityHistory}
                        title="Recent Activity"
                        accentClassName="text-blue-400 border-blue-500/20 bg-blue-500/10"
                        onClearHistory={handleClearHistory}
                    />

                    {/* Welcome Banner */}
                    <div className="mb-12">
                        <div className="bg-blue-600/10 backdrop-blur-xl border border-blue-500/20 rounded-[2rem] p-8 flex items-start space-x-6 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="bg-blue-600/20 p-4 rounded-2xl border border-blue-400/30 ring-4 ring-blue-500/5 group-hover:scale-110 transition-transform duration-500">
                                <Info className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-white tracking-tight uppercase italic mb-2">Workspace Preparation</h4>
                                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                    Your environment is isolated and encrypted. Sections are prioritized by deployment order. To perform a standard rollout, <strong>Module 1 is required</strong>. Secondary modules can be toggled and configured post-deployment.
                                </p>
                            </div>
                        </div>
                    </div>

                    {scanResults?.success && (
                        <div className="mb-8 bg-slate-900/50 border border-white/10 rounded-3xl p-6">
                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-3">Server Scan Status</h4>
                            {!scanResults.dockerInstalled ? (
                                <p className="text-xs text-amber-300">Docker not found on server.</p>
                            ) : (
                                <div className="space-y-2 text-xs">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                                        <div className="border border-white/5 rounded-xl px-3 py-2 bg-black/20">
                                            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Running</p>
                                            <p className="text-emerald-300 font-bold">{runningContainerCount}</p>
                                        </div>
                                        <div className="border border-white/5 rounded-xl px-3 py-2 bg-black/20">
                                            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Installed</p>
                                            <p className="text-blue-300 font-bold">{installedContainerCount}</p>
                                        </div>
                                        <div className="border border-white/5 rounded-xl px-3 py-2 bg-black/20">
                                            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Missing</p>
                                            <p className="text-amber-300 font-bold">{notFoundContainerCount}</p>
                                        </div>
                                    </div>
                                    {Object.entries(scanResults.containers || {}).map(([name, info]: any) => (
                                        <div key={name} className="flex items-center justify-between border border-white/5 rounded-xl px-3 py-2 bg-black/20">
                                            <span className="text-slate-300 font-semibold">{name}</span>
                                            <span className="text-slate-400">{info.status} {info.port ? `(port ${info.port})` : ''}</span>
                                        </div>
                                    ))}
                                    <p className="text-slate-400 mt-2">Cloudflare Tunnel: <span className="text-white">{scanResults.cloudflareStatus}</span></p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* App Sections */}
                    <div className="space-y-4">
                        <CoreSettings config={config} handleChange={handleChange} mainUrlError={mainUrlError} />
                        <DatabaseStorage config={config} handleChange={handleChange} />
                        <SocialNetworkAPIs config={config} handleChange={handleChange} activeProviders={activeProviders} toggleProvider={toggleProvider} />
                        <UserAuthentication config={config} handleChange={handleChange} />
                        <ShortLinkServices config={config} handleChange={handleChange} />
                        <PaymentsAndAI config={config} handleChange={handleChange} />
                        <DeveloperSettings config={config} handleChange={handleChange} />
                    </div>
                </div>

                {/* Right Side: Deployment Terminal & User Tools */}
                <div className="2xl:col-span-4 space-y-8">

                    {/* Create User Card */}
                    <div className="bg-emerald-950/10 backdrop-blur-xl rounded-[2.5rem] border border-emerald-500/20 p-8 relative overflow-hidden group/user shadow-2xl shadow-emerald-900/10">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-[80px] -z-0 -mr-32 -mt-32"></div>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl group-hover/user:scale-110 transition-transform">
                                <UserPlus className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-black text-white text-lg uppercase italic tracking-tight">Identity Hub</h3>
                                <p className="text-[10px] text-emerald-500/70 font-black uppercase tracking-widest mt-0.5">Isolated Workspace Creator</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2.5">Full Name</label>
                                <input
                                    type="text"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    placeholder="Executive Name"
                                    className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3.5 px-5 text-slate-100 placeholder-slate-800 focus:outline-none focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5 transition-all text-xs font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2.5">Auth Email</label>
                                <input
                                    type="email"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    placeholder="corp@endpoint.com"
                                    className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3.5 px-5 text-slate-100 placeholder-slate-800 focus:outline-none focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5 transition-all text-xs font-bold"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2.5">
                                    <label className="block text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Temporal Key</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewUserPassword(prev => !prev)}
                                        className="text-[9px] font-bold text-emerald-400/70 hover:text-emerald-300 flex items-center bg-emerald-500/5 px-3 py-1 rounded-full transition-all border border-emerald-500/20 hover:border-emerald-500/40"
                                    >
                                        {showNewUserPassword ? <EyeOff className="w-3 h-3 mr-1.5" /> : <Eye className="w-3 h-3 mr-1.5" />}
                                        {showNewUserPassword ? 'Hide Value' : 'View Value'}
                                    </button>
                                </div>
                                <input
                                    type={showNewUserPassword ? 'text' : 'password'}
                                    value={newUserPassword}
                                    onChange={(e) => setNewUserPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3.5 px-5 text-slate-100 placeholder-slate-800 focus:outline-none focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5 transition-all text-xs font-bold"
                                />
                            </div>
                            <button
                                onClick={handleCreateUser}
                                disabled={isCreatingUser || !newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim() || !config.serverHost}
                                className="w-full py-4 font-black rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs uppercase tracking-widest italic mt-4"
                            >
                                {isCreatingUser ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating</> : <>Generate Account Profile</>}
                            </button>
                        </div>
                    </div>

                    {/* High-Tech Terminal */}
                    <div className="sticky top-[140px] bg-slate-950/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.8)] flex flex-col h-[calc(100vh-180px)] overflow-hidden ring-1 ring-white/5">
                        <div className="bg-slate-900/50 border-b border-white/5 flex items-center justify-between p-6 shadow-sm z-10">
                            <h2 className="text-[10px] font-black flex items-center text-slate-400 tracking-[0.3em] uppercase italic">
                                <Terminal className="w-4 h-4 mr-3 text-blue-500" />
                                Output Console
                            </h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleFetchLogs}
                                    disabled={isFetchingLogs || isDeploying || !config.serverHost}
                                    className="flex items-center px-4 py-2 text-[9px] font-black rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all uppercase tracking-widest"
                                >
                                    {isFetchingLogs ? <><Loader2 className="w-3 h-3 mr-2 animate-spin" />Pulling</> : <>Sync Logs</>}
                                </button>
                                <button
                                    onClick={handleScan}
                                    disabled={isScanning || isDeploying || !config.serverHost}
                                    className="flex items-center px-4 py-2 text-[9px] font-black rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all uppercase tracking-widest"
                                >
                                    {isScanning ? <><Loader2 className="w-3 h-3 mr-2 animate-spin" />Syncing</> : <><RefreshCw className="w-3 h-3 mr-2" />Sync Server</>}
                                </button>
                                {isDeploying && <div className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </div>}
                            </div>
                        </div>

                        <div className="flex-1 bg-black/40 p-8 overflow-y-auto font-mono text-[12px] leading-[1.8] custom-scrollbar shadow-inner relative">
                            {log.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-800">
                                    <Terminal className="w-16 h-16 mb-6 opacity-5" />
                                    <p className="italic font-bold uppercase tracking-widest opacity-20">Idle Status - Awaiting Data</p>
                                </div>
                            ) : (
                                <div className="space-y-2 pb-12">
                                    {log.map((line: string, i: number) => (
                                        <div key={i} className="flex gap-4">
                                            <span className="text-blue-900/50 font-black select-none shrink-0 w-8">{String(i + 1).padStart(3, '0')}</span>
                                            <span className={`${line.includes('ERROR') ? 'text-rose-400 font-bold bg-rose-500/5 px-2 rounded' : line.includes('WARN') ? 'text-amber-400' : 'text-slate-400'} break-words whitespace-pre-wrap`}>
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
                    <div className="w-full max-w-2xl bg-slate-950 border border-white/10 rounded-[2rem] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.8)] overflow-hidden">
                        <div className="px-6 md:px-8 py-5 border-b border-white/10 bg-slate-900/60">
                            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-blue-400">Pre-Deploy Preview</p>
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
                                    <p className="text-slate-500 uppercase tracking-widest font-black text-[10px]">Mode</p>
                                    <p className="text-slate-200 font-bold mt-1 uppercase">{deployActionLabel}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                    <p className="text-slate-500 uppercase tracking-widest font-black text-[10px]">Main URL</p>
                                    <p className="text-slate-200 font-bold mt-1 break-all">{config.MAIN_URL || (deployMode === 'remove' || deployMode === 'remove-tunnel' ? 'Not required for this action' : 'Not set')}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                    <p className="text-slate-500 uppercase tracking-widest font-black text-[10px]">Postiz Port</p>
                                    <p className="text-slate-200 font-bold mt-1">{config.POSTIZ_PORT || '4007'}</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                    {postizActionSummary ? 'Action Summary' : 'Current Server State'}
                                </p>
                                {postizActionSummary ? (
                                    <p className="text-xs text-slate-300">{postizActionSummary}</p>
                                ) : !scanResults?.success ? (
                                    <p className="text-xs text-amber-300">No sync data yet. Run Sync Server for a current-state preview.</p>
                                ) : (
                                    <div className="space-y-1 text-xs text-slate-300">
                                        <p>Docker: <span className="text-white">{scanResults.dockerInstalled ? 'Installed' : 'Missing (will be installed)'}</span></p>
                                        <p>Cloudflare Tunnel: <span className="text-white">{scanResults.cloudflareStatus}</span></p>
                                    </div>
                                )}
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
                                disabled={isDeploying || !!mainUrlError}
                                className="px-6 h-11 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
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
                    background: rgba(255, 255, 255, 0.1);
                }
            `}} />
        </div>
    );
}
