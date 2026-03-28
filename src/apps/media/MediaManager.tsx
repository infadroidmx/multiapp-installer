import { useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Clapperboard, Cloud, ExternalLink, Loader2, RefreshCw, Save, Send, Terminal, XCircle } from 'lucide-react';
import { useMediaLogic } from './hooks/useMediaLogic';
import { FormGroup } from '../../components/FormGroup';
import { ServerProfileManager } from '../../components/ServerProfileManager';
import { ServerHealthPanel } from '../../components/ServerHealthPanel';
import { ActivityHistoryPanel } from '../../components/ActivityHistoryPanel';

const SERVICE_CATALOG = [
	{ key: 'portainer', label: 'Portainer', defaultPort: 9000, desc: 'Docker management UI' },
	{ key: 'sabnzbd', label: 'SABnzbd', defaultPort: 8080, desc: 'Usenet downloader' },
	{ key: 'deluge', label: 'Deluge', defaultPort: 8112, desc: 'BitTorrent client' },
	{ key: 'jackett', label: 'Jackett', defaultPort: 9117, desc: 'Torrent indexer proxy' },
	{ key: 'flaresolverr', label: 'FlareSolverr', defaultPort: 8191, desc: 'Cloudflare bypass proxy' },
	{ key: 'radarr', label: 'Radarr', defaultPort: 7878, desc: 'Movie collection manager' },
	{ key: 'sonarr', label: 'Sonarr', defaultPort: 8989, desc: 'TV series manager' },
	{ key: 'profilarr', label: 'Profilarr', defaultPort: 6868, desc: 'Quality profile manager' },
	{ key: 'requesterr', label: 'Requestrr', defaultPort: 4545, desc: 'Media request bot' },
	{ key: 'watchtower', label: 'Watchtower', defaultPort: null, desc: 'Auto-update containers' }
];

const CF_STEPS = [
	{
		num: 1,
		title: 'Create a Cloudflare account & add your domain',
		body: 'Sign up at cloudflare.com (free plan works). Add your domain and update your domain\'s nameservers to Cloudflare\'s. Wait for DNS propagation (usually a few minutes).'
	},
	{
		num: 2,
		title: 'Enable Zero Trust',
		body: 'In the Cloudflare dashboard, click "Zero Trust" in the left sidebar. On first visit choose a team name (e.g. yourname) — this becomes your team URL. Select the Free plan.'
	},
	{
		num: 3,
		title: 'Create tunnel (exact options)',
		body: 'Zero Trust → Networks → Tunnels → Create a tunnel. Select Connector type: Cloudflared. Tunnel name: media-server (or any name). Environment: Linux. This app uses the service token method (not cert.pem login). Click Save tunnel.'
	},
	{
		num: 4,
		title: 'Copy token exactly',
		body: 'On Install connector page, Cloudflare shows: cloudflared service install <TOKEN>. Copy only <TOKEN> (do not include cloudflared/service/install text, quotes, or spaces). Paste that token into Tunnel Token in this app.'
	},
	{
		num: 5,
		title: 'Deploy with this installer',
		body: 'With the token entered and Cloudflare Tunnel enabled, click Deploy Stack. The installer will download cloudflared, install it as a systemd service on your server, and start the tunnel automatically.'
	},
	{
		num: 6,
		title: 'Add one Public Hostname per app',
		body: 'Edit tunnel → Public Hostnames → Add public hostname. You must add one entry for EACH enabled app (Portainer, Radarr, Sonarr, etc). For each entry use Service type: HTTP and URL: localhost with that app port. One tunnel can serve all apps, but each app needs its own hostname record.'
	},
	{
		num: 7,
		title: 'Access your services securely via HTTPS',
		body: 'Each service is now reachable through its hostname URL with automatic HTTPS — no firewall ports needed. Cloudflare handles SSL certificates for you. Traffic is proxied through Cloudflare\'s global network.'
	}
];

export default function MediaManager({ onBack }: { onBack: () => void }) {
    const {
		config,
		log,
		deployMode,
		setDeployMode,
		isDeploying,
		isSaving,
		hasUnsavedChanges,
		selectedCount,
		profiles,
		activeProfileId,
		scanResults,
		isScanning,
		isTestingConnection,
		serverHealth,
		activityHistory,
		activeProfileName,
		hasRunningServices,
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
	} = useMediaLogic() as any;

	const [showCfInstructions, setShowCfInstructions] = useState(false);
	const [showDeployPreview, setShowDeployPreview] = useState(false);
	const deployModeLabels: Record<string, string> = {
		deploy: hasRunningServices ? 'Update Stack' : 'Deploy Stack',
		'remove-tunnel': 'Remove Tunnel',
		'remove-all': 'Remove Stack'
	};
	const genericDomain = 'yourdomain.com';
	const lastSyncedAt = scanResults?.serverHealth?.checkedAt
		? new Date(scanResults.serverHealth.checkedAt).toLocaleString(undefined, {
			month: 'short',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		})
		: null;
	const mediaContainerEntries = Object.entries(scanResults?.containers || {}) as Array<[string, any]>;
	const mediaRunningCount = mediaContainerEntries.filter(([, info]) => info?.status === 'running').length;
	const mediaInstalledCount = mediaContainerEntries.filter(([, info]) => info?.status && info.status !== 'not_found').length;
	const mediaMissingCount = mediaContainerEntries.filter(([, info]) => info?.status === 'not_found').length;

	const cloudflareRoutes = SERVICE_CATALOG
		.filter((svc) => svc.defaultPort && config?.mediaServices?.[svc.key])
		.map((svc) => {
			const currentPort = Number(config?.mediaPorts?.[svc.key]) || svc.defaultPort;
			const subdomain = svc.label.toLowerCase().replace(/[^a-z0-9]/g, '');
			return {
				key: svc.key,
				label: svc.label,
				hostnameExample: `${subdomain}.${genericDomain}`,
				serviceType: 'HTTP',
				serviceUrl: `localhost:${currentPort}`
			};
		});

	const getServiceStatus = (key: string) => {
		if (!scanResults?.success || !scanResults.containers?.[key]) return null;
		const info = scanResults.containers[key];
		if (info.status === 'running') return { label: 'Running', cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' };
		if (info.status === 'not_found') return { label: 'Not Installed', cls: 'bg-slate-700/30 text-slate-500 border border-slate-600/20' };
		return { label: 'Stopped', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/25' };
	};

	const deployLabel = deployModeLabels[deployMode] || 'Deploy Stack';
	const selectedServices = SERVICE_CATALOG.filter((svc) => Boolean(config?.mediaServices?.[svc.key]));
	const requiresSelectedServices = deployMode === 'deploy';

	const openDeployPreview = () => {
		if (isDeploying || (requiresSelectedServices && selectedCount === 0)) return;
		setShowDeployPreview(true);
	};

	const confirmDeploy = async () => {
		setShowDeployPreview(false);
		await handleDeploy();
	};

	return (
		<div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 lg:p-16 overflow-x-hidden selection:bg-orange-500/30">
			{/* Header */}
			<div className="max-w-[1700px] mx-auto flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between bg-slate-900/60 backdrop-blur-2xl border border-white/5 px-6 md:px-8 py-6 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] mb-12 sticky top-6 z-50">
				<div className="flex items-center gap-4 md:gap-6 min-w-0">
					<button
						onClick={onBack}
						className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-slate-400 hover:text-white"
					>
						<ArrowLeft className="w-4 h-4" />
						<span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Return</span>
					</button>

					<div className="h-10 w-px bg-white/5 hidden md:block"></div>

					<div className="flex items-center space-x-4">
						<div className="bg-gradient-to-tr from-orange-500 to-red-600 p-3 rounded-2xl shadow-2xl shadow-orange-500/20 ring-1 ring-white/20">
							<Clapperboard className="w-6 h-6 text-white" />
						</div>
						<div>
							<h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">Media Stack Manager</h1>
							<p className="text-[10px] text-slate-500 font-black tracking-[0.2em] uppercase">Docker Media Suite v1.0.0</p>
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
							? 'bg-orange-600/10 text-orange-400 hover:bg-orange-600/20 border-orange-500/30'
							: 'bg-white/5 text-slate-600 cursor-not-allowed border-white/5'
							}`}
					>
						{isSaving ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Syncing</> : <><Save className="w-3.5 h-3.5 md:mr-2" /> <span className="hidden md:inline">Save Config</span></>}
					</button>

					<div className="flex bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden h-14">
						<div className="relative flex items-center border-r border-white/5 h-full">
							<select
								value={deployMode}
								onChange={(e) => setDeployMode(e.target.value)}
								disabled={isDeploying}
								className="bg-transparent text-slate-300 h-full pl-5 pr-12 font-black text-[10px] uppercase tracking-widest focus:outline-none appearance-none cursor-pointer hover:bg-white/5 transition-colors"
							>
								<option value="deploy" className="bg-slate-950">{hasRunningServices ? 'Update Stack' : 'Deploy Stack'}</option>
								<option value="remove-tunnel" className="bg-slate-950">Remove Tunnel</option>
								<option value="remove-all" className="bg-slate-950">Remove Stack</option>
							</select>
							<ChevronDown className="w-4 h-4 text-slate-600 absolute right-5 pointer-events-none" />
						</div>
						<button
							onClick={openDeployPreview}
							disabled={isDeploying || (requiresSelectedServices && selectedCount === 0)}
							className="flex items-center px-8 h-full font-black rounded-r-2xl bg-gradient-to-b from-orange-500 to-red-700 hover:from-orange-400 hover:to-red-600 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest text-[11px] italic"
						>
							{isDeploying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deploying</> : <><Send className="w-4 h-4 mr-2" />{deployLabel}</>}
						</button>
					</div>

					<span className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border whitespace-nowrap ${scanResults?.success ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-white/10 bg-white/5'}`}>
						{scanResults?.success ? `Last Sync: ${lastSyncedAt}` : 'Last Sync: Never'}
					</span>
				</div>
			</div>

			<div className="max-w-[1700px] mx-auto grid grid-cols-1 2xl:grid-cols-12 gap-12">
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
						expectedAppId="media"
						accentClassName="text-orange-400 border-orange-500/20 bg-orange-500/10"
					/>

					<ServerHealthPanel
						health={serverHealth}
						title="Server Health"
						accentClassName="text-orange-400 border-orange-500/20 bg-orange-500/10"
					/>

					<ActivityHistoryPanel
						items={activityHistory}
						title="Recent Activity"
						accentClassName="text-orange-400 border-orange-500/20 bg-orange-500/10"
						onClearHistory={handleClearHistory}
					/>

					<div className="bg-orange-600/10 backdrop-blur-xl border border-orange-500/20 rounded-[2rem] p-8 mb-8">
						<h2 className="text-lg font-black text-white uppercase tracking-tight italic mb-2">Server Connection</h2>
						<p className="text-slate-400 text-sm">Choose services to install, customize ports, then scan to check current state or deploy changes to your remote Ubuntu/Debian server.</p>
					</div>

					<FormGroup label="Server IP Address" name="serverHost" placeholder="192.168.1.100" value={config.serverHost} onChange={handleTextChange} />
					<FormGroup label="SSH Username" name="serverUser" placeholder="root" value={config.serverUser} onChange={handleTextChange} />
					<FormGroup label="SSH Password" name="serverPassword" type="password" placeholder="••••••" value={config.serverPassword} onChange={handleTextChange} />

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<FormGroup label="Timezone" name="mediaTimezone" placeholder="UTC" value={config.mediaTimezone} onChange={handleTextChange} />
						<FormGroup label="PUID" name="mediaPuid" placeholder="1000" value={config.mediaPuid} onChange={handleTextChange} />
						<FormGroup label="PGID" name="mediaPgid" placeholder="1000" value={config.mediaPgid} onChange={handleTextChange} />
					</div>

					<FormGroup label="Stack Directory" name="mediaStackDir" placeholder="/root/media-stack" value={config.mediaStackDir} onChange={handleTextChange} helpText="Install path for docker-compose.yml, app configs, downloads, and media folders." />

					{/* Service Selection */}
					<div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 md:p-8 mt-8">
						<div className="flex items-center justify-between mb-5">
							<h3 className="text-white font-black uppercase tracking-widest text-xs">Service Selection & Ports</h3>
							<div className="flex items-center gap-3">
								<button
									onClick={handleScan}
									disabled={isScanning || isDeploying || !config.serverHost}
									className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
								>
									{isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
									<span className="hidden sm:inline">{isScanning ? 'Syncing...' : 'Sync Server'}</span>
								</button>
								<span className="text-xs text-slate-400 font-bold">{selectedCount} selected</span>
							</div>
						</div>

						{scanResults?.success && (
							<div className={`p-3 rounded-2xl mb-4 text-xs font-bold ${scanResults.dockerInstalled ? 'bg-slate-800/50 border border-white/5' : 'bg-amber-500/10 border border-amber-500/20'}`}>
								{scanResults.dockerInstalled ? (
									<div className="space-y-2">
										<div className="flex items-center gap-3">
										<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
										<span className="text-slate-300">
											Docker detected on server.{' '}
											{hasRunningServices
												? <span className="text-orange-400">Deploy button will update running containers.</span>
												: <span className="text-slate-400">No services currently running.</span>}
										</span>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
											<div className="border border-white/5 rounded-xl px-3 py-2 bg-black/20">
												<p className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Running</p>
												<p className="text-emerald-300 font-bold">{mediaRunningCount}</p>
											</div>
											<div className="border border-white/5 rounded-xl px-3 py-2 bg-black/20">
												<p className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Installed</p>
												<p className="text-orange-300 font-bold">{mediaInstalledCount}</p>
											</div>
											<div className="border border-white/5 rounded-xl px-3 py-2 bg-black/20">
												<p className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Missing</p>
												<p className="text-amber-300 font-bold">{mediaMissingCount}</p>
											</div>
										</div>
									</div>
								) : (
									<>
										<XCircle className="w-4 h-4 text-amber-400 shrink-0" />
										<span className="text-amber-300">Docker not found — Deploy will install it automatically.</span>
									</>
								)}
							</div>
						)}

						<div className="space-y-3">
							{SERVICE_CATALOG.map((svc) => {
								const isEnabled = !!config?.mediaServices?.[svc.key];
								const statusInfo = getServiceStatus(svc.key);
								const detectedPort = scanResults?.containers?.[svc.key]?.port;
								const servicePort = Number(config?.mediaPorts?.[svc.key]) || svc.defaultPort;
								const hasDetectedPort = Number.isInteger(detectedPort);
								const portMismatch = hasDetectedPort && !!servicePort && Number(detectedPort) !== Number(servicePort);
								const serviceSubdomain = svc.label.toLowerCase().replace(/[^a-z0-9]/g, '');
								return (
									<div key={svc.key}>
										<div className="grid grid-cols-12 gap-3 items-center bg-slate-950/50 border border-white/5 rounded-2xl p-3">
										<div className="col-span-8 md:col-span-7 flex items-center gap-3">
											<button
												type="button"
												onClick={() => toggleService(svc.key)}
												className={`w-12 h-7 rounded-full border transition-all shrink-0 ${isEnabled ? 'bg-orange-500 border-orange-400' : 'bg-slate-800 border-slate-700'}`}
											>
												<span className={`block w-5 h-5 rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`}></span>
											</button>
											<div className="min-w-0">
												<div className="flex items-center gap-2 flex-wrap">
													<p className="text-sm font-bold text-white">{svc.label}</p>
													{statusInfo && (
														<span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${statusInfo.cls}`}>
															{statusInfo.label}
														</span>
													)}
												</div>
												<p className="text-[10px] text-slate-500 uppercase tracking-widest truncate">{svc.desc}</p>
												{scanResults?.success && svc.defaultPort && (
													<div className="mt-1 flex items-center gap-2 flex-wrap">
														<span className="text-[10px] text-slate-300 uppercase tracking-widest">
															Configured: {servicePort}
														</span>
														<span className="text-[10px] text-cyan-300 uppercase tracking-widest">
															Detected: {hasDetectedPort ? detectedPort : 'N/A'}
														</span>
														{portMismatch && (
															<span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
																Port mismatch
															</span>
														)}
													</div>
												)}
											</div>
										</div>

										<div className="col-span-4 md:col-span-5">
											{svc.defaultPort ? (
												<input
													type="number"
													min={1}
													max={65535}
													disabled={!isEnabled}
													value={config?.mediaPorts?.[svc.key] || ''}
													onChange={(e) => setServicePort(svc.key, e.target.value)}
													className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs font-semibold text-slate-100 disabled:opacity-40"
													placeholder={String(svc.defaultPort)}
												/>
											) : (
												<div className="text-[11px] text-slate-500 font-semibold">No web port</div>
											)}
										</div>
										</div>

										{config.cloudflareEnabled && isEnabled && svc.defaultPort && (
											<div className="ml-3 md:ml-16 mt-2 bg-orange-500/5 border border-orange-500/15 rounded-xl p-3">
												<p className="text-[11px] text-orange-300 font-bold uppercase tracking-wider">Use Cloudflare Tunnel for {svc.label}</p>
												<div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs">
													<p className="text-slate-400">Subdomain: <span className="text-white">{serviceSubdomain}</span></p>
													<p className="text-slate-400">Domain: <span className="text-white">{genericDomain}</span></p>
													<p className="text-slate-400">Path: <span className="text-white">(leave empty)</span></p>
													<p className="text-slate-400">Service Type: <span className="text-white">HTTP</span></p>
													<p className="text-slate-400 md:col-span-2">URL: <span className="text-white">localhost:{servicePort}</span></p>
												</div>
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>

					{/* Cloudflare Tunnel */}
					<div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 md:p-8 mt-8">
						<div className="flex items-center justify-between mb-1">
							<div className="flex items-center gap-3">
								<div className="bg-orange-500/10 border border-orange-500/20 p-2 rounded-xl">
									<Cloud className="w-5 h-5 text-orange-400" />
								</div>
								<div>
									<h3 className="text-white font-black uppercase tracking-widest text-xs">Cloudflare Tunnel</h3>
									<p className="text-[10px] text-slate-500 mt-0.5">No firewall ports needed — expose services via Cloudflare Zero Trust</p>
								</div>
							</div>
							<button
								type="button"
								onClick={toggleCloudflare}
								className={`w-14 h-8 rounded-full border transition-all shrink-0 ${config.cloudflareEnabled ? 'bg-orange-500 border-orange-400' : 'bg-slate-800 border-slate-700'}`}
							>
								<span className={`block w-6 h-6 rounded-full bg-white transition-transform ${config.cloudflareEnabled ? 'translate-x-7' : 'translate-x-1'}`}></span>
							</button>
						</div>
						<p className="text-[11px] text-slate-400 mt-3">
							One tunnel token can route all enabled apps through separate hostnames. If Cloudflare is OFF, the stack installs normally and you access apps directly via server IP and port.
						</p>
						{deployMode === 'remove-tunnel' && (
							<div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-200">
								Remove Tunnel will uninstall the Cloudflare connector service from the server without deleting the media containers.
							</div>
						)}

						{config.cloudflareEnabled && (
							<div className="mt-6 space-y-4">
								<FormGroup
									label="Tunnel Token"
									name="cloudflareToken"
									type="password"
									placeholder="Paste your Cloudflare tunnel token here"
									value={config.cloudflareToken}
									onChange={handleTextChange}
									helpText="Zero Trust → Networks → Tunnels → your tunnel → Install connector. Paste only the token value from: cloudflared service install <TOKEN>."
								/>

								<button
									type="button"
									onClick={() => setShowCfInstructions((v) => !v)}
									className="flex items-center gap-2 w-full px-5 py-3 bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-300 text-xs font-black uppercase tracking-widest transition-all"
								>
									{showCfInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
									{showCfInstructions ? 'Hide Setup Instructions' : 'Show Step-by-Step Setup Instructions'}
								</button>

								{showCfInstructions && (
									<div className="bg-slate-950/60 border border-orange-500/15 rounded-2xl p-6 space-y-5">
										<div className="flex items-center justify-between mb-2">
											<h4 className="text-orange-400 font-black text-xs uppercase tracking-widest">Cloudflare Tunnel Setup Guide</h4>
											<a
												href="https://one.dash.cloudflare.com"
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-1.5 text-[10px] text-orange-400/70 hover:text-orange-400 font-bold uppercase tracking-wider transition-colors"
											>
												Open Dashboard <ExternalLink className="w-3 h-3" />
											</a>
										</div>

										{CF_STEPS.map((step) => (
											<div key={step.num} className="flex gap-4">
												<div className="shrink-0 w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-[10px] font-black text-orange-400">
													{step.num}
												</div>
												<div>
													<p className="text-white font-bold text-sm mb-1">{step.title}</p>
													<p className="text-slate-400 text-xs leading-relaxed whitespace-pre-line">{step.body}</p>
												</div>
											</div>
										))}

										<div className="p-4 bg-sky-500/8 border border-sky-500/20 rounded-xl">
											<p className="text-sky-300 text-xs font-bold mb-2">Generic route example (replace with your service and port)</p>
											<p className="text-slate-400 text-xs">Subdomain: <span className="text-white">radarr</span></p>
											<p className="text-slate-400 text-xs">Domain: <span className="text-white">yourdomain.com</span></p>
											<p className="text-slate-400 text-xs">Path: <span className="text-white">(leave empty)</span></p>
											<p className="text-slate-400 text-xs">Service Type: <span className="text-white">HTTP</span></p>
											<p className="text-slate-400 text-xs">URL: <span className="text-white">localhost:7878</span></p>
										</div>

										<div className="p-4 bg-emerald-500/8 border border-emerald-500/20 rounded-xl">
											<p className="text-emerald-300 text-xs font-bold mb-2">Exact Public Hostname entries for your current enabled apps</p>
											{cloudflareRoutes.length === 0 ? (
												<p className="text-slate-400 text-xs">Enable at least one app with a web port to generate hostname mapping.</p>
											) : (
												<div className="space-y-2">
													{cloudflareRoutes.map((route) => (
														<div key={route.key} className="text-xs text-slate-300 leading-relaxed">
															<span className="text-white font-bold">{route.label}</span>
															<p className="text-slate-400">Hostname: {route.hostnameExample}</p>
															<p className="text-slate-400">Service type: {route.serviceType}</p>
															<p className="text-slate-400">URL: {route.serviceUrl}</p>
														</div>
													))}
												</div>
											)}
										</div>

										<div className="mt-4 p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl">
											<p className="text-blue-300 text-xs font-bold mb-1">Access policies (optional but recommended)</p>
											<p className="text-slate-400 text-xs leading-relaxed">
												In Zero Trust → Access → Applications, add an application per service hostname. Restrict access by email address or identity provider so only you can reach Radarr, Sonarr etc. without logging in first.
											</p>
										</div>

										<div className="p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl">
											<p className="text-amber-300 text-xs font-bold mb-1">Note on SABnzbd behind a reverse proxy</p>
											<p className="text-slate-400 text-xs leading-relaxed">
												SABnzbd requires trusted proxy headers. In SABnzbd Config → General, add Cloudflare IP ranges to trusted hosts, or set Host whitelist to your tunnel hostname. If the web UI shows a "Refused connection" banner — this is why.
											</p>
										</div>
									</div>
								)}
							</div>
						)}

						{scanResults?.success && (
							<div className={`flex items-center gap-2 mt-4 text-xs font-bold ${scanResults.cloudflareStatus === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
								{scanResults.cloudflareStatus === 'active'
									? <><CheckCircle2 className="w-3.5 h-3.5" /> Cloudflare Tunnel service is active on server</>
									: <><XCircle className="w-3.5 h-3.5" /> Cloudflare Tunnel not running on server</>}
							</div>
						)}
					</div>
				</div>

				{/* Console */}
				<div className="2xl:col-span-4">
					<div className="sticky top-[140px] bg-slate-950/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.8)] flex flex-col h-[calc(100vh-180px)] overflow-hidden ring-1 ring-white/5">
						<div className="bg-slate-900/50 border-b border-white/5 flex items-center justify-between p-6 z-10">
							<h2 className="text-[10px] font-black flex items-center text-slate-400 tracking-[0.3em] uppercase italic">
								<Terminal className="w-4 h-4 mr-3 text-orange-500" />
								Deployment Output
							</h2>
						</div>

						<div className="flex-1 bg-black/40 p-8 overflow-y-auto font-mono text-[12px] leading-[1.8] custom-scrollbar shadow-inner relative">
							{log.length === 0 ? (
								<div className="h-full flex flex-col items-center justify-center text-slate-800">
									<Terminal className="w-16 h-16 mb-6 opacity-5" />
									<p className="italic font-bold uppercase tracking-widest opacity-20">Idle Console</p>
								</div>
							) : (
								<div className="space-y-2 pb-12">
									{log.map((line: string, i: number) => (
										<div key={i} className="flex gap-4">
											<span className="text-orange-900/50 font-black select-none shrink-0 w-8">{String(i + 1).padStart(3, '0')}</span>
											<span className={`${line.includes('ERROR') ? 'text-rose-400 font-bold bg-rose-500/5 px-2 rounded' : line.includes('WARN') ? 'text-amber-400' : 'text-slate-400'} break-words whitespace-pre-wrap`}>
												{line}
											</span>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{showDeployPreview && (
				<div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm p-4 md:p-6 flex items-center justify-center">
					<div className="w-full max-w-2xl bg-slate-950 border border-white/10 rounded-[2rem] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.8)] overflow-hidden">
						<div className="px-6 md:px-8 py-5 border-b border-white/10 bg-slate-900/60">
							<p className="text-[10px] font-black tracking-[0.2em] uppercase text-orange-400">Pre-Deploy Preview</p>
							<h3 className="text-white text-xl font-black uppercase italic mt-1">Review Before {deployLabel}</h3>
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
									<p className="text-slate-200 font-bold mt-1 uppercase">{deployLabel}</p>
								</div>
								<div className="rounded-xl border border-white/10 bg-white/5 p-3">
									<p className="text-slate-500 uppercase tracking-widest font-black text-[10px]">Stack Directory</p>
									<p className="text-slate-200 font-bold mt-1 break-all">{config.mediaStackDir || '/root/media-stack'}</p>
								</div>
								<div className="rounded-xl border border-white/10 bg-white/5 p-3">
									<p className="text-slate-500 uppercase tracking-widest font-black text-[10px]">Cloudflare Tunnel</p>
									<p className={`font-bold mt-1 ${config.cloudflareEnabled ? 'text-emerald-300' : 'text-slate-300'}`}>
										{config.cloudflareEnabled ? 'Enabled' : 'Disabled'}
									</p>
								</div>
								<div className="rounded-xl border border-white/10 bg-white/5 p-3">
									<p className="text-slate-500 uppercase tracking-widest font-black text-[10px]">Last Server Sync</p>
									<p className={`font-bold mt-1 ${scanResults?.success ? 'text-emerald-300' : 'text-amber-300'}`}>
										{scanResults?.success ? 'Available' : 'Not synced yet'}
									</p>
								</div>
							</div>

							<div className="rounded-2xl border border-white/10 bg-black/20 p-4">
								<p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
									{deployMode === 'deploy' ? `Selected Services (${selectedServices.length})` : 'Action Summary'}
								</p>
								{deployMode !== 'deploy' ? (
									<p className="text-xs text-slate-300">
										{deployMode === 'remove-tunnel'
											? 'The Cloudflare tunnel service will be removed. Media containers and volumes stay intact.'
											: 'The full media stack, managed containers, and stack directory will be removed from the server.'}
									</p>
								) : selectedServices.length === 0 ? (
									<p className="text-xs text-amber-300">No services selected. Choose at least one service.</p>
								) : (
									<div className="space-y-2">
										{selectedServices.map((svc) => {
											const detected = scanResults?.containers?.[svc.key];
											const configuredPort = svc.defaultPort ? Number(config?.mediaPorts?.[svc.key]) || svc.defaultPort : null;
											return (
												<div key={svc.key} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-xs">
													<div>
														<p className="text-slate-200 font-bold">{svc.label}</p>
														<p className="text-slate-500">Configured port: {configuredPort || 'N/A'}</p>
													</div>
													<p className="text-slate-400 uppercase tracking-wider text-[10px] font-black">
														{detected?.status || 'unknown'}
													</p>
												</div>
											);
										})}
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
								disabled={(requiresSelectedServices && selectedServices.length === 0) || isDeploying}
								className="px-6 h-11 rounded-xl bg-gradient-to-b from-orange-500 to-red-700 hover:from-orange-400 hover:to-red-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
							>
								Confirm {deployLabel}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
