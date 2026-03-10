import React, { useState, useEffect } from 'react';
import { Server, Key, Cloud, Send, Terminal, Loader2, Link as LinkIcon, Save, Database, Shield, LayoutGrid, HelpCircle, ChevronDown, ArrowUpRight, UserPlus } from 'lucide-react';

const FormGroup = ({ label, name, type = "text", placeholder = "", autoFocus = false, value, onChange, helpText, helpLink }: any) => (
    <div className="mb-5 bg-slate-800/20 p-4 border border-slate-700/30 rounded-xl relative group hover:bg-slate-800/40 transition-colors">
        <div className="flex justify-between items-center mb-2">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest flex items-center">
                {label}
            </label>
            {helpLink && (
                <a href={helpLink} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline flex items-center bg-blue-500/10 px-2 py-1 rounded-full transition-all group-hover:bg-blue-500/20">
                    <HelpCircle className="w-3 h-3 mr-1" /> Help Guide
                </a>
            )}
        </div>

        <input
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full bg-slate-900 border border-slate-700/50 rounded-lg py-2.5 px-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm shadow-inner"
        />

        {helpText && <p className="mt-2 text-[11px] text-slate-400 leading-relaxed border-l-2 border-slate-700 pl-2">{helpText}</p>}
    </div>
);

const ToggleSwitch = ({ label, name, value, onChange, helpText }: any) => {
    // Treat string 'true', '1', or boolean true as on
    const isChecked = value === true || value === 'true' || value === '1';

    const handleToggle = () => {
        // Mock a change event to reuse the same handleChange handler
        const simulateEvent = {
            target: {
                name,
                value: isChecked ? 'false' : 'true'
            }
        };
        onChange(simulateEvent as unknown as React.ChangeEvent<HTMLInputElement>);
    };

    return (
        <div className="mb-5 bg-slate-800/20 p-4 border border-slate-700/30 rounded-xl relative group hover:bg-slate-800/40 transition-colors flex flex-col justify-center">
            <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest cursor-pointer" onClick={handleToggle}>
                    {label}
                </label>
                <div
                    onClick={handleToggle}
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out flex items-center shadow-inner ${isChecked ? 'bg-blue-600 border border-blue-500' : 'bg-slate-700 border border-slate-600'}`}
                >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isChecked ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
            </div>
            {helpText && <p className="mt-2 text-[11px] text-slate-400 leading-relaxed border-l-2 border-slate-700 pl-2">{helpText}</p>}
        </div>
    );
};

const Section = ({ title, icon: Icon, description, helpLink, children }: any) => (
    <div className="bg-[#0b1120] rounded-2xl p-6 border border-slate-800 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/5 rounded-full blur-3xl -z-10 -mr-32 -mt-32"></div>
        <div className="mb-6 flex flex-col border-b border-slate-800/80 pb-4">
            <h2 className="text-xl font-bold flex items-center text-slate-100">
                <div className="p-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg mr-3 shadow-inner border border-slate-700/50">
                    <Icon className="w-5 h-5 text-blue-400" />
                </div>
                {title}
                {helpLink && (
                    <a href={helpLink} target="_blank" rel="noreferrer" className="ml-auto flex items-center text-xs font-semibold text-blue-400/80 bg-blue-900/20 hover:bg-blue-900/40 hover:text-blue-300 border border-blue-500/20 hover:border-blue-500/40 px-3 py-1.5 rounded-full transition-all">
                        <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />
                        View Master Docs
                    </a>
                )}
            </h2>
            {description && <p className="text-slate-400 text-sm mt-3 lg:w-2/3 leading-relaxed">{description}</p>}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-2 z-10 relative">
            {children}
        </div>
    </div>
);

const ProviderBlock = ({ title, isActive, onToggle, children }: any) => {
    return (
        <div className={`col-span-1 lg:col-span-2 xl:col-span-3 mb-6 bg-slate-900/50 rounded-xl border transition-all duration-300 ${isActive ? 'border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-slate-800 hover:border-slate-700'}`}>
            <div
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={onToggle}
            >
                <h3 className={`font-bold text-lg flex items-center transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                    {title}
                </h3>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out flex items-center shadow-inner ${isActive ? 'bg-blue-600 border border-blue-500' : 'bg-slate-800 border border-slate-700'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
            </div>
            {isActive && (
                <div className="p-4 border-t border-slate-800/50 bg-slate-900/30 rounded-b-xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-2">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function App() {
    const [config, setConfig] = useState<any>({});
    const [log, setLog] = useState<string[]>([]);
    const [deployMode, setDeployMode] = useState('update');
    const [isDeploying, setIsDeploying] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingLogs, setIsFetchingLogs] = useState(false);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // UI State for expanding/collapsing Provider profiles
    const [activeProviders, setActiveProviders] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.loadConfig().then((data: any) => {
                const loadedConfig = data || {};
                let requiresSave = false;

                // Auto-generate a local JWT Secret if it doesn't already exist in their config
                if (!loadedConfig.JWT_SECRET) {
                    loadedConfig.JWT_SECRET = Array.from(window.crypto.getRandomValues(new Uint8Array(32)))
                        .map(b => b.toString(16).padStart(2, '0')).join('');
                    requiresSave = true;
                }

                // Pre-fill essential defaults to keep the GUI from sending empty criticals
                if (!loadedConfig.STORAGE_PROVIDER) { loadedConfig.STORAGE_PROVIDER = 'local'; requiresSave = true; }
                if (!loadedConfig.UPLOAD_DIRECTORY) { loadedConfig.UPLOAD_DIRECTORY = '/uploads'; requiresSave = true; }
                if (!loadedConfig.NEXT_PUBLIC_UPLOAD_DIRECTORY) { loadedConfig.NEXT_PUBLIC_UPLOAD_DIRECTORY = '/uploads'; requiresSave = true; }
                if (!loadedConfig.POSTIZ_PORT) { loadedConfig.POSTIZ_PORT = '4007'; requiresSave = true; }

                setConfig(loadedConfig);
                if (requiresSave) setHasUnsavedChanges(true);

                if (loadedConfig) {
                    // Hydrate active providers based on existing keys
                    setActiveProviders({
                        twitter: !!loadedConfig.X_API_KEY,
                        linkedin: !!loadedConfig.LINKEDIN_CLIENT_ID,
                        facebook: !!loadedConfig.FACEBOOK_APP_ID,
                        instagram: !!loadedConfig.INSTAGRAM_CLIENT_ID,
                        youtube: !!loadedConfig.YOUTUBE_CLIENT_ID,
                        tiktok: !!loadedConfig.TIKTOK_CLIENT_ID,
                        pinterest: !!loadedConfig.PINTEREST_CLIENT_ID,
                        discord: !!loadedConfig.DISCORD_CLIENT_ID,
                        reddit: !!loadedConfig.REDDIT_CLIENT_ID,
                        github: !!loadedConfig.GITHUB_CLIENT_ID,
                        mastodon: !!loadedConfig.MASTODON_CLIENT_ID,
                        threads: !!loadedConfig.THREADS_APP_ID,
                        beehiiv: !!loadedConfig.BEEHIIVE_API_KEY,
                        dribbble: !!loadedConfig.DRIBBBLE_CLIENT_ID,
                        slack: !!loadedConfig.SLACK_ID
                    });
                }
            });
            window.electronAPI.onLogMessage((msg: string) => {
                setLog(prev => [...prev, msg]);
            });
        }
    }, []);

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

        setConfig(newConfig);
        setHasUnsavedChanges(true);
    };

    const toggleProvider = (providerKey: string) => {
        setActiveProviders(prev => ({
            ...prev,
            [providerKey]: !prev[providerKey]
        }));
    };

    const handleSave = async () => {
        if (!window.electronAPI) return;
        setIsSaving(true);
        await window.electronAPI.saveConfig(config);
        setHasUnsavedChanges(false);
        setTimeout(() => setIsSaving(false), 500);
    };

    const handleDeploy = async () => {
        if (!window.electronAPI) return;
        if (hasUnsavedChanges) {
            await handleSave();
        }
        setIsDeploying(true);
        setLog([]);
        await window.electronAPI.deployServer(config, deployMode);
        setIsDeploying(false);
    };

    const handleFetchLogs = async () => {
        if (!window.electronAPI) return;
        setIsFetchingLogs(true);
        setLog(['--- Fetching Docker Container Logs ---']);
        await window.electronAPI.fetchLogs(config);
        setIsFetchingLogs(false);
    };



    const handleCreateUser = async () => {
        if (!window.electronAPI || !newUserEmail.trim() || !newUserName.trim() || !newUserPassword.trim()) return;
        setIsCreatingUser(true);
        setLog([`--- Creating user: ${newUserName} (${newUserEmail}) ---`]);
        await window.electronAPI.createUser(config, newUserName.trim(), newUserEmail.trim(), newUserPassword.trim());
        setIsCreatingUser(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 overflow-x-hidden selection:bg-blue-500/30">

            {/* Top Navigation */}
            <div className="max-w-[1800px] mx-auto flex items-center justify-between bg-[#0b1120]/80 backdrop-blur-md border border-slate-800 px-6 py-4 md:px-8 md:py-5 rounded-2xl shadow-xl shadow-black/50 mb-8 sticky top-4 z-50">
                <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg border border-blue-500/30">
                        <LayoutGrid className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 tracking-tight">
                            Multiapp Installer
                        </h1>
                        <p className="text-[11px] text-slate-400 font-semibold tracking-widest uppercase mt-0.5">Unified Deployment System</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3 md:space-x-5 shadow-2xl rounded-lg">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !hasUnsavedChanges}
                        className={`flex items-center px-6 py-3 rounded-xl font-bold transition-all duration-300 ${hasUnsavedChanges
                            ? 'bg-blue-900/40 text-blue-300 hover:bg-blue-900/60 border border-blue-700/50 shadow-inner'
                            : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                            }`}
                    >
                        {isSaving ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                        ) : (
                            <><Save className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Save Configuration</span></>
                        )}
                    </button>

                    <div className="flex bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl h-12">
                        <div className="relative flex items-center border-r border-slate-700/50 h-full">
                            <select
                                value={deployMode}
                                onChange={(e) => setDeployMode(e.target.value)}
                                disabled={isDeploying}
                                className="bg-transparent text-slate-300 h-full pl-4 pr-10 font-semibold text-sm focus:outline-none appearance-none cursor-pointer hover:bg-slate-800/50 transition-colors"
                            >
                                <option value="update" className="bg-slate-900">Update Container</option>
                                <option value="full" className="bg-slate-900">Install Fresh</option>
                                <option value="tunnel" className="bg-slate-900">Reset Tunnel</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 pointer-events-none" />
                        </div>
                        <button
                            onClick={handleDeploy}
                            disabled={isDeploying}
                            className="flex items-center px-6 h-full font-black bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white transition-all rounded-r-xl disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs"
                        >
                            {isDeploying ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> ACTIVE...</>
                            ) : (
                                <><Send className="w-4 h-4 mr-2" /> DEPLOY</>
                            )}
                        </button>
                    </div>
                </div>
            </div>



            {/* Create User Panel */}
            <div className="max-w-[1800px] mx-auto mb-6">
                <div className="bg-[#0b1120] rounded-2xl border border-emerald-800/30 shadow-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-32 bg-emerald-500/3 rounded-full blur-3xl -z-0 -mr-16 -mt-16"></div>
                    <div className="flex flex-col gap-4 z-10 relative">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-900/30 border border-emerald-700/40 rounded-lg">
                                <UserPlus className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-emerald-300 text-sm uppercase tracking-widest">Create Client Account</h3>
                                <p className="text-slate-400 text-xs mt-0.5">Manually create a new isolated workspace for a client without them needing to self-register.</p>
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-3 items-end">
                            <div className="flex-1">
                                <label className="block text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Full Name</label>
                                <input
                                    type="text"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    placeholder="John Smith"
                                    className="w-full bg-slate-900 border border-slate-700/50 rounded-lg py-2.5 px-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all text-sm"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Email</label>
                                <input
                                    type="email"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    placeholder="client@example.com"
                                    className="w-full bg-slate-900 border border-slate-700/50 rounded-lg py-2.5 px-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all text-sm"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Temporary Password</label>
                                <input
                                    type="password"
                                    value={newUserPassword}
                                    onChange={(e) => setNewUserPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-900 border border-slate-700/50 rounded-lg py-2.5 px-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all text-sm"
                                />
                            </div>
                            <button
                                onClick={handleCreateUser}
                                disabled={isCreatingUser || !newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim() || !config.serverHost}
                                className="flex items-center px-5 py-2.5 font-bold rounded-lg bg-emerald-900/40 text-emerald-300 border border-emerald-700/40 hover:bg-emerald-800/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm whitespace-nowrap"
                            >
                                {isCreatingUser ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <>👤 Create Account</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1800px] mx-auto grid grid-cols-1 2xl:grid-cols-12 gap-10">

                {/* Left Side: Forms */}
                <div className="2xl:col-span-8 space-y-2">

                    <Section
                        title="1. Core Virtual Machine Settings"
                        icon={Server}
                        description="These credentials are required to SSH into the remote Ubuntu virtual machine and scaffold the network. Also dictates the main domain addresses where the application lives."
                        helpLink="https://docs.postiz.com/configuration/overview"
                    >
                        <FormGroup label="Server IP Address" name="serverHost" placeholder="192.168.1.100" autoFocus={true} value={config.serverHost} onChange={handleChange} helpText="The public IP address of your remote deployment server." />
                        <FormGroup label="SSH Username" name="serverUser" placeholder="root" value={config.serverUser} onChange={handleChange} helpText="Usually 'root' or 'ubuntu'." />
                        <FormGroup label="SSH Password" name="serverPassword" type="password" value={config.serverPassword} onChange={handleChange} helpText="The password used to connect to your virtual machine via SSH." />
                        <FormGroup label="Cloudflare Tunnel Token" name="CLOUDFLARE_TOKEN" placeholder="eyJh..." type="password" value={config.CLOUDFLARE_TOKEN} onChange={handleChange} helpText="HOW TO GET: Cloudflare Dashboard -> Zero Trust -> Networks -> Tunnels. Create a tunnel, and copy the token from the install command." helpLink="https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-local-tunnel/" />
                        <FormGroup label="Public Domain URL" name="MAIN_URL" placeholder="https://app.postiz.com" value={config.MAIN_URL} onChange={handleChange} helpText="EXTREMELY IMPORTANT: Your public facing URL (e.g., https://post.example.com). This MUST match the Public Hostname you configure in Cloudflare Zero Trust. Make sure to include https:// and DO NOT include a trailing slash." />

                        <div className="opacity-60 saturate-50 pointer-events-none relative">
                            <div className="absolute inset-0 bg-slate-900/10 z-10 rounded-xl" />
                            <FormGroup label="Frontend Domain URL" name="FRONTEND_URL" placeholder="https://app.postiz.com" value={config.FRONTEND_URL} onChange={handleChange} helpText="Auto-assigned based on your Public Domain URL." />
                            <FormGroup label="Backend API URL" name="NEXT_PUBLIC_BACKEND_URL" placeholder="https://app.postiz.com/api" value={config.NEXT_PUBLIC_BACKEND_URL} onChange={handleChange} helpText="Auto-assigned based on your Public Domain URL." />
                        </div>
                        <FormGroup label="Docker Port" name="POSTIZ_PORT" placeholder="4007" value={config.POSTIZ_PORT} onChange={handleChange} helpText="EXTREMELY IMPORTANT: This is the port your app will run on locally. When you set up your Public Hostname in Cloudflare, you MUST point it to: http://localhost:PORT (Default is 4007)." />
                        <FormGroup label="JWT Secret Hash" name="JWT_SECRET" placeholder="Random alphanumeric string" type="password" value={config.JWT_SECRET} onChange={handleChange} helpText="A securely randomly generated string used for hashing user sessions." />
                        <ToggleSwitch label="Is General (Multi-Tenant Mode)" name="IS_GENERAL" value={config.IS_GENERAL} onChange={handleChange} helpText="ON: Standard SaaS mode — multiple clients can each manage their own separate brands/workspaces. OFF: Locks the entire platform to one single business only." />
                        <ToggleSwitch label="Disable Registration" name="DISABLE_REGISTRATION" value={config.DISABLE_REGISTRATION} onChange={handleChange} helpText="ON: Blocks visitors from self-registering. Turn ON after creating your first admin account so only invited clients can join." />
                    </Section>

                    <Section
                        title="2. Database & Image Storage"
                        icon={Database}
                        description="Toggle between storing files locally on the VM's hard drive or pushing media into a Cloudflare R2 highly available bucket."
                        helpLink="https://docs.postiz.com/configuration/r2"
                    >
                        <FormGroup label="Storage Location" name="STORAGE_PROVIDER" placeholder="local or cloudflare" value={config.STORAGE_PROVIDER} onChange={handleChange} helpText="Type 'local' to use the VM disk, or 'cloudflare' to use R2 buckets." />
                        <FormGroup label="Local Upload Path" name="UPLOAD_DIRECTORY" placeholder="/uploads" value={config.UPLOAD_DIRECTORY} onChange={handleChange} helpText="The internal folder path on the Ubuntu VM where local images are saved (Default: /uploads)." />
                        <FormGroup label="Public Upload Path" name="NEXT_PUBLIC_UPLOAD_DIRECTORY" placeholder="/uploads" value={config.NEXT_PUBLIC_UPLOAD_DIRECTORY} onChange={handleChange} helpText="The public URL path used by the frontend to serve the uploaded images (Default: /uploads)." />
                        <FormGroup label="Cloudflare Account ID" name="CLOUDFLARE_ACCOUNT_ID" value={config.CLOUDFLARE_ACCOUNT_ID} onChange={handleChange} helpText="Your Cloudflare account identifier, located in the right sidebar of the Cloudflare Dashboard." helpLink="https://dash.cloudflare.com" />
                        <FormGroup label="R2 Access Key" name="CLOUDFLARE_ACCESS_KEY" type="password" value={config.CLOUDFLARE_ACCESS_KEY} onChange={handleChange} helpText="Generated in your Cloudflare R2 dashboard under 'Manage R2 API Tokens'." />
                        <FormGroup label="R2 Secret Key" name="CLOUDFLARE_SECRET_ACCESS_KEY" type="password" value={config.CLOUDFLARE_SECRET_ACCESS_KEY} onChange={handleChange} helpText="The secret key generated alongside your R2 Access Key." />
                        <FormGroup label="R2 Bucket Name" name="CLOUDFLARE_BUCKETNAME" value={config.CLOUDFLARE_BUCKETNAME} onChange={handleChange} helpText="The exact name of the bucket you created in Cloudflare R2." />
                        <FormGroup label="Public Bucket URL" name="CLOUDFLARE_BUCKET_URL" placeholder="https://...r2.cloudflarestorage.com" value={config.CLOUDFLARE_BUCKET_URL} onChange={handleChange} helpText="The custom domain or public R2.dev URL linked to your bucket." />
                    </Section>

                    <Section
                        title="3. Social Network APIs"
                        icon={Key}
                        description="Enable the social networks you want to connect to. Inputs will appear once the provider is toggled on."
                        helpLink="https://docs.postiz.com/providers/overview"
                    >
                        <ProviderBlock title="X (Twitter)" isActive={activeProviders.twitter} onToggle={() => toggleProvider('twitter')}>
                            <FormGroup label="X (Twitter) API Key" name="X_API_KEY" value={config.X_API_KEY} onChange={handleChange} helpText="HOW TO GET: developer.x.com -> Developer Portal -> Projects & Apps. Business/Regular: Create an App, get 'API Key and Secret' (Consumer Keys). Requires Basic or Enterprise tier for posting. Free tier has severe limits." helpLink="https://docs.postiz.com/providers/x-twitter" />
                            <FormGroup label="X (Twitter) API Secret" name="X_API_SECRET" type="password" value={config.X_API_SECRET} onChange={handleChange} />
                        </ProviderBlock>

                        <ProviderBlock title="LinkedIn" isActive={activeProviders.linkedin} onToggle={() => toggleProvider('linkedin')}>
                            <FormGroup label="LinkedIn Client ID" name="LINKEDIN_CLIENT_ID" value={config.LINKEDIN_CLIENT_ID} onChange={handleChange} helpText='HOW TO GET: linkedin.com/developers/apps. Business: Create an app, associate it with your LinkedIn Company Page. Regular: Same process, but you might need to create a dummy company page first. Request access to "Share on LinkedIn" and "Sign In with LinkedIn".' helpLink="https://docs.postiz.com/providers/linkedin" />
                            <FormGroup label="LinkedIn Client Secret" name="LINKEDIN_CLIENT_SECRET" type="password" value={config.LINKEDIN_CLIENT_SECRET} onChange={handleChange} />
                        </ProviderBlock>

                        <ProviderBlock title="Facebook" isActive={activeProviders.facebook} onToggle={() => toggleProvider('facebook')}>
                            <FormGroup label="Facebook App ID" name="FACEBOOK_APP_ID" value={config.FACEBOOK_APP_ID} onChange={handleChange} helpText="HOW TO GET: developers.facebook.com. Business: Requires Facebook Business Manager verification for public use. Regular: You can use it in 'Development Mode' just for your own account without verification." helpLink="https://docs.postiz.com/providers/facebook" />
                            <FormGroup label="Facebook App Secret" name="FACEBOOK_APP_SECRET" type="password" value={config.FACEBOOK_APP_SECRET} onChange={handleChange} />
                        </ProviderBlock>

                        <ProviderBlock title="Instagram" isActive={activeProviders.instagram} onToggle={() => toggleProvider('instagram')}>
                            <FormGroup label="Instagram Client ID" name="INSTAGRAM_CLIENT_ID" value={config.INSTAGRAM_CLIENT_ID} onChange={handleChange} helpText="HOW TO GET: developers.facebook.com. Instagram requires setting up a Facebook App first and adding the Instagram Graph API." helpLink="https://docs.postiz.com/providers/instagram" />
                            <FormGroup label="Instagram Client Secret" name="INSTAGRAM_CLIENT_SECRET" type="password" value={config.INSTAGRAM_CLIENT_SECRET} onChange={handleChange} />
                        </ProviderBlock>

                        <ProviderBlock title="YouTube" isActive={activeProviders.youtube} onToggle={() => toggleProvider('youtube')}>
                            <FormGroup label="YouTube Client ID" name="YOUTUBE_CLIENT_ID" value={config.YOUTUBE_CLIENT_ID} onChange={handleChange} helpText="HOW TO GET: console.cloud.google.com. Business/Regular: Create a project, enable YouTube Data API v3. Create OAuth Client ID (Web Application)." helpLink="https://docs.postiz.com/providers/youtube" />
                            <FormGroup label="YouTube Client Secret" name="YOUTUBE_CLIENT_SECRET" type="password" value={config.YOUTUBE_CLIENT_SECRET} onChange={handleChange} />
                        </ProviderBlock>

                        <ProviderBlock title="TikTok" isActive={activeProviders.tiktok} onToggle={() => toggleProvider('tiktok')}>
                            <FormGroup label="TikTok Client ID" name="TIKTOK_CLIENT_ID" value={config.TIKTOK_CLIENT_ID} onChange={handleChange} helpText="HOW TO GET: developers.tiktok.com. Business/Regular: Need an approved TikTok Developer account." helpLink="https://docs.postiz.com/providers/tiktok" />
                            <FormGroup label="TikTok Client Secret" name="TIKTOK_CLIENT_SECRET" type="password" value={config.TIKTOK_CLIENT_SECRET} onChange={handleChange} />
                        </ProviderBlock>

                        <ProviderBlock title="Pinterest" isActive={activeProviders.pinterest} onToggle={() => toggleProvider('pinterest')}>
                            <FormGroup label="Pinterest Client ID" name="PINTEREST_CLIENT_ID" value={config.PINTEREST_CLIENT_ID} onChange={handleChange} helpText="HOW TO GET: developers.pinterest.com. Business/Regular: Create an app to get your App ID and App secret." helpLink="https://docs.postiz.com/providers/pinterest" />
                            <FormGroup label="Pinterest Client Secret" name="PINTEREST_CLIENT_SECRET" type="password" value={config.PINTEREST_CLIENT_SECRET} onChange={handleChange} />
                        </ProviderBlock>

                        <ProviderBlock title="Discord" isActive={activeProviders.discord} onToggle={() => toggleProvider('discord')}>
                            <FormGroup label="Discord Client ID" name="DISCORD_CLIENT_ID" value={config.DISCORD_CLIENT_ID} onChange={handleChange} helpText="HOW TO GET: discord.com/developers/applications. Business/Regular: Create a New Application. Go to OAuth2 to get Client ID/Secret. Go to Bot section to get the Bot Token." helpLink="https://docs.postiz.com/providers/discord" />
                            <FormGroup label="Discord Client Secret" name="DISCORD_CLIENT_SECRET" type="password" value={config.DISCORD_CLIENT_SECRET} onChange={handleChange} />
                            <FormGroup label="Discord Bot Token ID" name="DISCORD_BOT_TOKEN_ID" type="password" value={config.DISCORD_BOT_TOKEN_ID} onChange={handleChange} />
                        </ProviderBlock>

                        <ProviderBlock title="Reddit" isActive={activeProviders.reddit} onToggle={() => toggleProvider('reddit')}>
                            <FormGroup label="Reddit Client ID" name="REDDIT_CLIENT_ID" value={config.REDDIT_CLIENT_ID} onChange={handleChange} helpText='HOW TO GET: reddit.com/prefs/apps. Business/Regular: Click "are you a developer? create an app". Choose "web app". Use your frontend URL + /api/auth/callback/reddit as the redirect URI.' helpLink="https://docs.postiz.com/providers/reddit" />
                            <FormGroup label="Reddit Client Secret" name="REDDIT_CLIENT_SECRET" type="password" value={config.REDDIT_CLIENT_SECRET} onChange={handleChange} />
                        </ProviderBlock>

                        <ProviderBlock title="GitHub" isActive={activeProviders.github} onToggle={() => toggleProvider('github')}>
                            <FormGroup label="GitHub Client ID" name="GITHUB_CLIENT_ID" value={config.GITHUB_CLIENT_ID} onChange={handleChange} helpText="HOW TO GET: github.com/settings/applications/new. Business: Create under your Organization settings. Regular: Create under your Personal Developer settings." helpLink="https://docs.postiz.com/providers/overview" />
                            <FormGroup label="GitHub Client Secret" name="GITHUB_CLIENT_SECRET" type="password" value={config.GITHUB_CLIENT_SECRET} onChange={handleChange} />
                        </ProviderBlock>

                        <ProviderBlock title="Mastodon" isActive={activeProviders.mastodon} onToggle={() => toggleProvider('mastodon')}>
                            <FormGroup label="Mastodon URL" name="MASTODON_URL" placeholder="https://mastodon.social" value={config.MASTODON_URL} onChange={handleChange} helpText="HOW TO GET: Given the decentralized nature, you create this on your specific instance. Example: mastodon.social/settings/applications. Create a new app there." helpLink="https://docs.postiz.com/providers/mastodon" />
                            <FormGroup label="Mastodon Client ID" name="MASTODON_CLIENT_ID" value={config.MASTODON_CLIENT_ID} onChange={handleChange} />
                            <FormGroup label="Mastodon Client Secret" name="MASTODON_CLIENT_SECRET" type="password" value={config.MASTODON_CLIENT_SECRET} onChange={handleChange} />
                        </ProviderBlock>

                        <ProviderBlock title="Threads" isActive={activeProviders.threads} onToggle={() => toggleProvider('threads')}>
                            <FormGroup label="Threads App ID" name="THREADS_APP_ID" value={config.THREADS_APP_ID} onChange={handleChange} helpText="HOW TO GET: developers.facebook.com. Business/Regular: Create an app. Add the 'Threads API' product. You'll need an Instagram account." helpLink="https://docs.postiz.com/providers/threads" />
                            <FormGroup label="Threads App Secret" name="THREADS_APP_SECRET" type="password" value={config.THREADS_APP_SECRET} onChange={handleChange} />
                        </ProviderBlock>

                        <ProviderBlock title="Beehiiv" isActive={activeProviders.beehiiv} onToggle={() => toggleProvider('beehiiv')}>
                            <FormGroup label="Beehiiv API Key" name="BEEHIIVE_API_KEY" value={config.BEEHIIVE_API_KEY} onChange={handleChange} helpText="HOW TO GET: app.beehiiv.com/settings/api. Need a paid Beehiiv plan to generate API keys." />
                            <FormGroup label="Beehiiv Publication ID" name="BEEHIIVE_PUBLICATION_ID" value={config.BEEHIIVE_PUBLICATION_ID} onChange={handleChange} />
                        </ProviderBlock>

                        <ProviderBlock title="Dribbble" isActive={activeProviders.dribbble} onToggle={() => toggleProvider('dribbble')}>
                            <FormGroup label="Dribbble Client ID" name="DRIBBBLE_CLIENT_ID" value={config.DRIBBBLE_CLIENT_ID} onChange={handleChange} />
                            <FormGroup label="Dribbble Client Secret" name="DRIBBBLE_CLIENT_SECRET" type="password" value={config.DRIBBBLE_CLIENT_SECRET} onChange={handleChange} />
                        </ProviderBlock>

                        <ProviderBlock title="Slack" isActive={activeProviders.slack} onToggle={() => toggleProvider('slack')}>
                            <FormGroup label="Slack Client ID" name="SLACK_ID" value={config.SLACK_ID} onChange={handleChange} />
                            <FormGroup label="Slack Client Secret" name="SLACK_SECRET" type="password" value={config.SLACK_SECRET} onChange={handleChange} />
                            <FormGroup label="Slack Signing Secret" name="SLACK_SIGNING_SECRET" type="password" value={config.SLACK_SIGNING_SECRET} onChange={handleChange} />
                        </ProviderBlock>
                    </Section>

                    <Section
                        title="4. User Authentication (Authentik SSO)"
                        icon={Shield}
                        description="If you are delegating user authentication outside of Postiz, define the remote Authentik or SSO provider variables below."
                        helpLink="https://docs.postiz.com/configuration/oauth"
                    >
                        <FormGroup label="SSO Display Name" name="NEXT_PUBLIC_POSTIZ_OAUTH_DISPLAY_NAME" placeholder="Authentik" value={config.NEXT_PUBLIC_POSTIZ_OAUTH_DISPLAY_NAME} onChange={handleChange} helpText="The visual text on the login button (e.g., 'Log in with Authentik')." />
                        <FormGroup label="SSO Logo Image URL" name="NEXT_PUBLIC_POSTIZ_OAUTH_LOGO_URL" value={config.NEXT_PUBLIC_POSTIZ_OAUTH_LOGO_URL} onChange={handleChange} helpText="A direct link to the logo icon featured on the SSO button." />
                        <ToggleSwitch label="Generic OAuth Enabled" name="POSTIZ_GENERIC_OAUTH" value={config.POSTIZ_GENERIC_OAUTH} onChange={handleChange} helpText="ON: Replaces the native login with a third-party Single Sign-On flow." />
                        <FormGroup label="Authorization Server URL" name="POSTIZ_OAUTH_URL" value={config.POSTIZ_OAUTH_URL} onChange={handleChange} helpLink="https://goauthentik.io/docs/providers/oauth2/" helpText="The base URL of your identity provider." />
                        <FormGroup label="SSO Auth URL" name="POSTIZ_OAUTH_AUTH_URL" value={config.POSTIZ_OAUTH_AUTH_URL} onChange={handleChange} helpText="The OAuth2 authorization endpoint." />
                        <FormGroup label="SSO Token URL" name="POSTIZ_OAUTH_TOKEN_URL" value={config.POSTIZ_OAUTH_TOKEN_URL} onChange={handleChange} helpText="The endpoint where Postiz exchanges authorization codes for access tokens." />
                        <FormGroup label="SSO UserInfo URL" name="POSTIZ_OAUTH_USERINFO_URL" value={config.POSTIZ_OAUTH_USERINFO_URL} onChange={handleChange} helpText="The endpoint used to fetch the user profile data." />
                        <FormGroup label="SSO Client ID" name="POSTIZ_OAUTH_CLIENT_ID" value={config.POSTIZ_OAUTH_CLIENT_ID} onChange={handleChange} helpText="The OAuth client ID provided by your Single Sign-On provider." />
                        <FormGroup label="SSO Client Secret" name="POSTIZ_OAUTH_CLIENT_SECRET" type="password" value={config.POSTIZ_OAUTH_CLIENT_SECRET} onChange={handleChange} helpText="The highly sensitive secret paired with your OAuth Client ID." />
                        <FormGroup label="Requested Scopes" name="POSTIZ_OAUTH_SCOPE" placeholder="openid profile email" value={config.POSTIZ_OAUTH_SCOPE} onChange={handleChange} helpText="The specific data scopes Postiz will request (e.g., 'openid profile email')." />
                    </Section>

                    <Section
                        title="5. Short Link Services"
                        icon={LinkIcon}
                        description="Integrate services like Dub.co or Kutt to automatically shorten links generated within social media posts."
                        helpLink="https://docs.postiz.com/configuration/short-links"
                    >
                        <FormGroup label="Dub.co Access Token" name="DUB_TOKEN" type="password" value={config.DUB_TOKEN} onChange={handleChange} helpLink="https://dub.co/docs/api-reference/tokens" helpText="An API token generated from your short link provider." />
                        <FormGroup label="Dub API Endpoint" name="DUB_API_ENDPOINT" placeholder="https://api.dub.co" value={config.DUB_API_ENDPOINT} onChange={handleChange} helpText="The base API endpoint standard for short links." />
                        <FormGroup label="Dub Hosted Domain" name="DUB_SHORT_LINK_DOMAIN" placeholder="dub.sh" value={config.DUB_SHORT_LINK_DOMAIN} onChange={handleChange} helpText="The actual domain used for rendering shortened URLs (e.g., dub.sh)." />

                        <ToggleSwitch label="Run Background Cron" name="RUN_CRON" value={config.RUN_CRON} onChange={handleChange} helpText="ON: Activates the continuous background cron job to manage scheduling. Highly recommended." />
                        <FormGroup label="Server Port" name="POSTIZ_PORT" placeholder="4007" value={config.POSTIZ_PORT} onChange={handleChange} helpText="The internal VM port Postiz runs on (Default 4007)." />
                        <div className="hidden lg:block col-span-2 xl:col-span-3"></div>

                        <FormGroup label="Short.io Secret Key" name="SHORT_IO_SECRET_KEY" type="password" value={config.SHORT_IO_SECRET_KEY} onChange={handleChange} helpText="Leave blank if using Dub or LinkDrip." />
                        <div className="hidden lg:block col-span-2"></div>

                        <FormGroup label="Kutt API Key" name="KUTT_API_KEY" type="password" value={config.KUTT_API_KEY} onChange={handleChange} helpText="Leave blank if using Dub or LinkDrip." />
                        <FormGroup label="Kutt API Endpoint" name="KUTT_API_ENDPOINT" placeholder="https://kutt.it/api/v2" value={config.KUTT_API_ENDPOINT} onChange={handleChange} helpText="API Target for Kutt infrastructure." />
                        <FormGroup label="Kutt Hosted Domain" name="KUTT_SHORT_LINK_DOMAIN" placeholder="kutt.it" value={config.KUTT_SHORT_LINK_DOMAIN} onChange={handleChange} helpText="The domain serving Kutt URL shortening." />

                        <FormGroup label="LinkDrip API Key" name="LINK_DRIP_API_KEY" type="password" value={config.LINK_DRIP_API_KEY} onChange={handleChange} helpText="Leave blank if using Dub." />
                        <FormGroup label="LinkDrip Endpoint" name="LINK_DRIP_API_ENDPOINT" placeholder="https://api.linkdrip.com/v1/" value={config.LINK_DRIP_API_ENDPOINT} onChange={handleChange} helpText="LinkDrip API base path." />
                        <FormGroup label="LinkDrip Domain" name="LINK_DRIP_SHORT_LINK_DOMAIN" placeholder="dripl.ink" value={config.LINK_DRIP_SHORT_LINK_DOMAIN} onChange={handleChange} helpText="The domain used by LinkDrip." />
                    </Section>

                    <Section
                        title="6. Payments, AI & System Instrumentation"
                        icon={Cloud}
                        description="Global variables for Stripe billing, OpenAI post generation, and Sentry backend error tracking."
                        helpLink="https://docs.postiz.com/configuration/stripe"
                    >
                        <FormGroup label="OpenAI API Key" name="OPENAI_API_KEY" type="password" value={config.OPENAI_API_KEY} onChange={handleChange} helpText="Used for AI content generation in the app. Need a funded account to use API." helpLink="https://platform.openai.com/api-keys" />
                        <FormGroup label="Stripe Publishable Key" name="STRIPE_PUBLISHABLE_KEY" value={config.STRIPE_PUBLISHABLE_KEY} onChange={handleChange} helpText="Business: Essential if charging users. Regular: Not needed if you are the only user." helpLink="https://dashboard.stripe.com/apikeys" />
                        <FormGroup label="Stripe Secret Key" name="STRIPE_SECRET_KEY" type="password" value={config.STRIPE_SECRET_KEY} onChange={handleChange} helpText="Your Stripe application secret. Highly sensitive." />
                        <FormGroup label="Stripe Webhook Signing" name="STRIPE_SIGNING_KEY" type="password" value={config.STRIPE_SIGNING_KEY} onChange={handleChange} helpText="Given when you set up a webhook in Stripe. Verifies payloads." />
                        <FormGroup label="Stripe Connect Signing" name="STRIPE_SIGNING_KEY_CONNECT" type="password" value={config.STRIPE_SIGNING_KEY_CONNECT} onChange={handleChange} helpText="Used for automated Stripe Connect payouts to sub-accounts." />
                        <FormGroup label="Sentry DSN" name="NEXT_PUBLIC_SENTRY_DSN" placeholder="http://spotlight:8969/stream" value={config.NEXT_PUBLIC_SENTRY_DSN} onChange={handleChange} helpText="Tells the app where to send error and performance monitoring data." />
                        <ToggleSwitch label="Sentry Spotlight Enabled" name="SENTRY_SPOTLIGHT" value={config.SENTRY_SPOTLIGHT} onChange={handleChange} helpText="Turn ON to activate Spotlight debugging tools in the frontend console." />
                        <FormGroup label="Platform Fee Percentage" name="FEE_AMOUNT" placeholder="0.05" value={config.FEE_AMOUNT} onChange={handleChange} helpText="Percentage (e.g. 0.05 for 5%) taken from users selling services via your white-label instance." />
                        <FormGroup label="Max Rate Limit Tokens" name="API_LIMIT" placeholder="30" value={config.API_LIMIT} onChange={handleChange} helpText="Determines API rate-limiting thresholds to avoid abusive traffic spikes." />
                        <FormGroup label="Discord Support Server" name="NEXT_PUBLIC_DISCORD_SUPPORT" value={config.NEXT_PUBLIC_DISCORD_SUPPORT} onChange={handleChange} helpText="A link to your agency's Discord server shown inside the main UI for client help." />
                        <FormGroup label="Polotno API Key" name="NEXT_PUBLIC_POLOTNO" type="password" value={config.NEXT_PUBLIC_POLOTNO} onChange={handleChange} helpText="API key for the Polotno design editor embedded in the platform." />
                    </Section>

                    <Section
                        title="8. Developer Settings"
                        icon={Terminal}
                        description="Additional developer settings like Nx plugins."
                    >
                        <FormGroup label="NX PLUGINS" name="NX_ADD_PLUGINS" value={config.NX_ADD_PLUGINS} onChange={handleChange} helpText="A comma-separated list of extra Nx plugins to install upon deployment. Generally not needed." />
                    </Section>

                </div>

                {/* Right Side: Deployment Terminal */}
                <div className="2xl:col-span-4">
                    <div className="sticky top-[110px] bg-[#0b1120] rounded-2xl border border-slate-800 shadow-2xl flex flex-col h-[calc(100vh-140px)] overflow-hidden ring-1 ring-white/5">
                        <div className="bg-slate-900 border-b border-slate-800 flex items-center justify-between p-4 shadow-sm z-10">
                            <h2 className="text-[13px] font-bold flex items-center text-slate-300 tracking-widest uppercase">
                                <Terminal className="w-4 h-4 mr-2 text-indigo-400" />
                                Live Terminal Feed
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleFetchLogs}
                                    disabled={isFetchingLogs || isDeploying || !config.serverHost}
                                    title="Pull last 100 lines from the postiz Docker container"
                                    className="flex items-center px-3 py-1.5 text-[11px] font-bold rounded-lg bg-amber-900/30 text-amber-400 border border-amber-700/30 hover:bg-amber-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all uppercase tracking-wider"
                                >
                                    {isFetchingLogs ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Fetching...</> : <>📋 View Logs</>}
                                </button>
                                {isDeploying && <div className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </div>}
                            </div>
                        </div>

                        <div className="flex-1 bg-[#020617] p-5 overflow-y-auto font-mono text-[13px] leading-relaxed custom-scrollbar shadow-inner relative">
                            <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-[#020617] to-transparent z-10 pointer-events-none"></div>
                            {log.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-60">
                                    <Terminal className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="italic">Awaiting deployment command...</p>
                                </div>
                            ) : (
                                <div className="space-y-1.5 pt-2 pb-8">
                                    {log.map((line, i) => (
                                        <div key={i} className="break-words font-mono">
                                            <span className="text-emerald-500/50 mr-3 select-none">❯</span>
                                            <span className={`${line.includes('ERROR') || line.includes('WARN') ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
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
        </div>
    );
}
