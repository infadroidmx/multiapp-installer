import { useState } from 'react';
import { Terminal, Loader2, Save, ArrowLeft, Shield, Info, Rocket, Zap, ExternalLink, RefreshCw, ChevronDown } from 'lucide-react';
import { XuiCoreSettings } from './sections/XuiCoreSettings';
import { XuiPanelSettings } from './sections/XuiPanelSettings';
import { CloudflareTunnel } from './sections/CloudflareTunnel';
import { useXuiLogic } from './hooks/useXuiLogic';
import { ServerProfileManager } from '../../components/ServerProfileManager';
import { ServerHealthPanel } from '../../components/ServerHealthPanel';
import { ActivityHistoryPanel } from '../../components/ActivityHistoryPanel';

export default function XuiManager({ onBack }: { onBack: () => void }) {
    const [showDeployPreview, setShowDeployPreview] = useState(false);
    const deployModeLabels: Record<string, string> = {
        deploy: 'Deploy XUI',
        'remove-tunnel': 'Remove Tunnel',
        remove: 'Remove XUI'
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
        accessCode,
        activityHistory,
        profiles,
        activeProfileId,
        activeProfileName,
        scanResults,
        serverHealth,
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
    } = useXuiLogic() as any;
    const lastSyncedAt = scanResults?.serverHealth?.checkedAt
        ? new Date(scanResults.serverHealth.checkedAt).toLocaleString(undefined, {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
        : null;
    const deployActionLabel = deployModeLabels[deployMode] || 'Deploy XUI';
    const xuiActionSummary = deployMode === 'remove'
        ? 'This will stop and remove the XUI services, related data, and install artifacts from the server.'
        : deployMode === 'remove-tunnel'
            ? 'This will remove only the Cloudflare tunnel service. The XUI panel remains installed.'
            : null;

    const getXuiStatusMeta = (status: string) => {
        switch ((status || '').toLowerCase()) {
            case 'active':
                return { label: 'Running', className: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' };
            case 'installed_stopped':
                return { label: 'Installed (Stopped)', className: 'text-amber-300 border-amber-500/30 bg-amber-500/10' };
            case 'installed_unknown':
                return { label: 'Installed (Unknown State)', className: 'text-sky-300 border-sky-500/30 bg-sky-500/10' };
            case 'not_installed':
                return { label: 'Not Installed', className: 'text-slate-400 border-white/15 bg-white/5' };
            default:
                return { label: status || 'Unknown', className: 'text-slate-300 border-white/15 bg-white/5' };
        }
    };

    const xuiStatusMeta = getXuiStatusMeta(scanResults?.xuiStatus || '');

    const openDeployPreview = () => {
        if (isDeploying || !config.serverHost) return;
        setShowDeployPreview(true);
    };

    const confirmDeploy = async () => {
        setShowDeployPreview(false);
        await handleDeploy();
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 lg:p-16 overflow-x-hidden selection:bg-purple-500/30">

            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px]"></div>
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
                        <div className="bg-gradient-to-tr from-purple-600 to-blue-600 p-3 rounded-2xl shadow-2xl shadow-purple-500/20 ring-1 ring-white/20">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                                XUI <span className="text-purple-500">Manager</span>
                            </h1>
                            <p className="text-[10px] text-slate-500 font-black tracking-[0.2em] uppercase">Premium VPN Controller v1.5.12</p>
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
                            ? 'bg-purple-600/10 text-purple-400 hover:bg-purple-600/20 border-purple-500/30'
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
                                <option value="deploy" className="bg-slate-950">Deploy XUI</option>
                                <option value="remove-tunnel" className="bg-slate-950">Remove Tunnel</option>
                                <option value="remove" className="bg-slate-950">Remove XUI</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-600 absolute right-5 pointer-events-none" />
                        </div>
                        <button
                            onClick={openDeployPreview}
                            disabled={isDeploying || !config.serverHost}
                            className="flex items-center px-8 h-full font-black rounded-r-2xl bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white shadow-2xl shadow-purple-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all uppercase tracking-widest text-[11px] italic"
                        >
                            {isDeploying ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Active</>
                            ) : (
                                <><Zap className="w-4 h-4 mr-2" /> {deployActionLabel}</>
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
                        expectedAppId="xui"
                        accentClassName="text-purple-400 border-purple-500/20 bg-purple-500/10"
                    />

                    <ServerHealthPanel
                        health={serverHealth}
                        title="Server Health"
                        accentClassName="text-purple-400 border-purple-500/20 bg-purple-500/10"
                    />

                    <ActivityHistoryPanel
                        items={activityHistory}
                        title="Recent Activity"
                        accentClassName="text-purple-400 border-purple-500/20 bg-purple-500/10"
                        onClearHistory={handleClearHistory}
                    />

                    {/* Welcome Banner */}
                    <div className="mb-12">
                        <div className="bg-purple-600/10 backdrop-blur-xl border border-purple-500/20 rounded-[2rem] p-8 flex items-start space-x-6 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="bg-purple-600/20 p-4 rounded-2xl border border-purple-400/30 ring-4 ring-purple-500/5 group-hover:scale-110 transition-transform duration-500">
                                <Info className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-white tracking-tight uppercase italic mb-2">Automated Provisioning</h4>
                                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                    The XUI engine performs a <strong>Clean-State Install</strong>. It will compile PHP 7.4.33 from source, optimize the kernel with BBR, and apply the premium crack logic automatically.
                                </p>
                            </div>
                        </div>
                    </div>

                    {scanResults?.success && (
                        <div className="mb-8 bg-slate-900/50 border border-white/10 rounded-3xl p-6">
                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-3">Server Scan Status</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center justify-between border border-white/5 rounded-xl px-3 py-2 bg-black/20">
                                    <span className="text-slate-300 font-semibold">XUI Status</span>
                                    <span className={`px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${xuiStatusMeta.className}`}>
                                        {xuiStatusMeta.label}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border border-white/5 rounded-xl px-3 py-2 bg-black/20">
                                    <span className="text-slate-300 font-semibold">Cloudflare Tunnel</span>
                                    <span className={`px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${scanResults.cloudflareStatus === 'active' ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-400 border-white/15 bg-white/5'}`}>
                                        {scanResults.cloudflareStatus === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border border-white/5 rounded-xl px-3 py-2 bg-black/20">
                                    <span className="text-slate-300 font-semibold">Configured Port</span>
                                    <span className="text-slate-200 font-bold">{scanResults.configuredPort}</span>
                                </div>
                                <div className="flex items-center justify-between border border-white/5 rounded-xl px-3 py-2 bg-black/20">
                                    <span className="text-slate-300 font-semibold">Detected Port</span>
                                    <span className="text-slate-200 font-bold">{scanResults.detectedPort || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between border border-white/5 rounded-xl px-3 py-2 bg-black/20 md:col-span-2">
                                    <span className="text-slate-300 font-semibold">Detected Service Name</span>
                                    <span className="text-slate-400">{scanResults.detectedService || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between border border-white/5 rounded-xl px-3 py-2 bg-black/20 md:col-span-2">
                                    <span className="text-slate-300 font-semibold">Install Marker</span>
                                    <span className="text-slate-400">{scanResults.installMarker ? 'Detected' : 'Not detected'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <CloudflareTunnel config={config} handleChange={handleChange} />
                        <XuiCoreSettings config={config} handleChange={handleChange} />
                        <XuiPanelSettings config={config} handleChange={handleChange} />
                    </div>
                </div>

                {/* Right Side: Terminal & Output */}
                <div className="2xl:col-span-4 space-y-8">

                    {/* Success Access Card */}
                    {accessCode && (
                        <div className="bg-emerald-950/20 backdrop-blur-2xl rounded-[2.5rem] border border-emerald-500/40 p-8 shadow-2xl shadow-emerald-500/10 animate-in zoom-in-95 duration-700">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3.5 bg-emerald-500/20 rounded-2xl">
                                    <Rocket className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h3 className="font-black text-white text-lg uppercase italic">Ready for Launch</h3>
                            </div>
                            <div className="p-6 bg-slate-950 rounded-2xl border border-white/5 mb-6">
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Access Credentials</p>
                                <div className="text-2xl font-mono text-emerald-400 tracking-[0.2em] font-black">{accessCode}</div>
                            </div>
                            <a
                                href={`http://${config.serverHost}/${accessCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-3 py-4 font-black rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all text-xs uppercase tracking-widest italic"
                            >
                                Open XUI Panel <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    )}

                    {/* High-Tech Terminal */}
                    <div className="sticky top-[140px] bg-slate-950/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.8)] flex flex-col h-[calc(100vh-180px)] overflow-hidden ring-1 ring-white/5">
                        <div className="bg-slate-900/50 border-b border-white/5 flex items-center justify-between p-6 z-10">
                            <h2 className="text-[10px] font-black flex items-center text-slate-400 tracking-[0.3em] uppercase italic">
                                <Terminal className="w-4 h-4 mr-3 text-purple-500" />
                                Deployment Terminal
                            </h2>
                            {isDeploying && <div className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
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
                                            <span className="text-slate-800 font-black select-none shrink-0 w-8 group-hover/line:text-purple-900 transition-colors">{String(i + 1).padStart(3, '0')}</span>
                                            <span className={`${line.includes('ERROR') ? 'text-rose-400 font-bold bg-rose-500/5 px-2 rounded' : line.includes('BUILD_LOG') ? 'text-slate-500 text-[10px]' : 'text-slate-400'} break-words whitespace-pre-wrap`}>
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
                            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-purple-400">Pre-Deploy Preview</p>
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
                                    <p className="text-slate-500 uppercase tracking-widest font-black text-[10px]">Panel Port</p>
                                    <p className="text-slate-200 font-bold mt-1">{config.xuiPort || '80'}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                    <p className="text-slate-500 uppercase tracking-widest font-black text-[10px]">Admin Alias</p>
                                    <p className="text-slate-200 font-bold mt-1">{deployMode === 'deploy' ? (config.adminAlias || 'admin') : 'Not used for this action'}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                    <p className="text-slate-500 uppercase tracking-widest font-black text-[10px]">Performance Flags</p>
                                    <p className="text-slate-200 font-bold mt-1">{deployMode === 'deploy' ? `BBR ${config.enableBBR === 'true' ? 'ON' : 'OFF'} | Redis ${config.enableRedis === 'true' ? 'ON' : 'OFF'}` : 'Not used for this action'}</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                    {xuiActionSummary ? 'Action Summary' : 'Current Server State'}
                                </p>
                                {xuiActionSummary ? (
                                    <p className="text-xs text-slate-300">{xuiActionSummary}</p>
                                ) : !scanResults?.success ? (
                                    <p className="text-xs text-amber-300">No sync data yet. Run Sync Server for current XUI status.</p>
                                ) : (
                                    <div className="space-y-1 text-xs text-slate-300">
                                        <p>XUI Service: <span className="text-white">{scanResults.xuiStatus}</span></p>
                                        <p>Detected Port: <span className="text-white">{scanResults.detectedPort || 'N/A'}</span></p>
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
                                disabled={isDeploying || !config.serverHost}
                                className="px-6 h-11 rounded-xl bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
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
                    background: rgba(168, 85, 247, 0.1);
                }
            `}} />
        </div>
    );
}
