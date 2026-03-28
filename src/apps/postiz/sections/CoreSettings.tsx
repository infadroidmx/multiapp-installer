import { useState } from 'react';
import { Eye, EyeOff, Server, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Section } from '../../../components/Section';
import { FormGroup } from '../../../components/FormGroup';
import { ToggleSwitch } from '../../../components/ToggleSwitch';

export const CoreSettings = ({ config, handleChange, mainUrlError }: any) => {
    const [showJwtSecret, setShowJwtSecret] = useState(false);
    const [showCloudflareToken, setShowCloudflareToken] = useState(false);
    const [showCloudflareGuide, setShowCloudflareGuide] = useState(false);
    const postizPort = Number(config.POSTIZ_PORT || '4007') || 4007;

    return (
        <Section
            title="1. Core Virtual Machine Settings"
            icon={Server}
            description="These credentials are required to SSH into the remote Ubuntu virtual machine and scaffold the network. Also dictates the main domain addresses where the application lives."
            helpLink="https://docs.postiz.com/configuration/overview"
            layout="stack"
        >
            <FormGroup label="Server IP Address" name="serverHost" placeholder="192.168.1.100" autoFocus={true} value={config.serverHost} onChange={handleChange} helpText="The public IP address of your remote deployment server." />
            <FormGroup label="SSH Username" name="serverUser" placeholder="root" value={config.serverUser} onChange={handleChange} helpText="Usually 'root' or 'ubuntu'." />
            <FormGroup label="SSH Password" name="serverPassword" type="password" value={config.serverPassword} onChange={handleChange} helpText="The password used to connect to your virtual machine via SSH." />
            <div className="col-span-full mb-6 bg-white/5 backdrop-blur-sm p-6 border border-white/5 rounded-3xl relative group/input hover:bg-white/10 transition-all duration-500">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center group-hover/input:text-blue-400 transition-colors">
                        Cloudflare Tunnel Token
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowCloudflareToken(prev => !prev)}
                        className="text-[9px] font-bold text-blue-400/70 hover:text-blue-300 flex items-center bg-blue-500/5 px-3 py-1 rounded-full transition-all border border-blue-500/10 hover:border-blue-500/30"
                    >
                        {showCloudflareToken ? <EyeOff className="w-3 h-3 mr-1.5" /> : <Eye className="w-3 h-3 mr-1.5" />}
                        {showCloudflareToken ? 'Hide Tunnel Token' : 'View Tunnel Token'}
                    </button>
                </div>

                <div className="relative">
                    <input
                        type={showCloudflareToken ? 'text' : 'password'}
                        name="CLOUDFLARE_TOKEN"
                        value={config.CLOUDFLARE_TOKEN || ''}
                        onChange={handleChange}
                        placeholder="eyJh..."
                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 px-5 text-slate-100 placeholder-slate-700 focus:outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium shadow-2xl"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-blue-500/20 opacity-0 blur-xl -z-10 transition-opacity duration-500 pointer-events-none group-focus-within/input:opacity-100"></div>
                </div>

                <div className="mt-4 flex gap-3 items-start">
                    <div className="w-1 h-full min-h-[1.5rem] bg-slate-800 rounded-full group-hover/input:bg-blue-500/30 transition-colors"></div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                        One tunnel token can route many apps. Copy only the token value from: cloudflared service install {'<TOKEN>'}.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowCloudflareGuide(prev => !prev)}
                    className="mt-4 w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-300 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-2xl py-3 transition-all"
                >
                    {showCloudflareGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showCloudflareGuide ? 'Hide Cloudflare Setup Guide' : 'Show Cloudflare Setup Guide'}
                </button>

                {showCloudflareGuide && (
                    <div className="mt-4 p-5 bg-slate-950/60 border border-blue-500/15 rounded-2xl space-y-3">
                        <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">Exact Steps (Generic)</p>
                        <p className="text-xs text-slate-400">1) Zero Trust → Networks → Tunnels → Create tunnel</p>
                        <p className="text-xs text-slate-400">2) Connector: Cloudflared, Environment: Linux, then Save</p>
                        <p className="text-xs text-slate-400">3) Copy token from: cloudflared service install &lt;TOKEN&gt;</p>
                        <p className="text-xs text-slate-400">4) Deploy from this app with Cloudflare token filled</p>
                        <p className="text-xs text-slate-400">5) Add Public Hostname for Postiz with values below</p>

                        <div className="mt-3 p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl space-y-1">
                            <p className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">Public Hostname values for Postiz</p>
                            <p className="text-xs text-slate-400">Subdomain: <span className="text-white">postiz</span></p>
                            <p className="text-xs text-slate-400">Domain: <span className="text-white">yourdomain.com</span></p>
                            <p className="text-xs text-slate-400">Path: <span className="text-white">(leave empty)</span></p>
                            <p className="text-xs text-slate-400">Service type: <span className="text-white">HTTP</span></p>
                            <p className="text-xs text-slate-400">URL: <span className="text-white">localhost:{postizPort}</span></p>
                        </div>

                        <a
                            href="https://one.dash.cloudflare.com"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider"
                        >
                            Open Zero Trust Dashboard <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                )}

                <a
                    href="https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-local-tunnel/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex mt-4 text-[9px] font-bold text-blue-400/60 hover:text-blue-400 items-center bg-blue-500/5 px-3 py-1 rounded-full transition-all border border-blue-500/10 hover:border-blue-500/30"
                >
                    Documentation
                </a>
            </div>
            <FormGroup label="Public Domain URL" name="MAIN_URL" placeholder="https://app.postiz.com" value={config.MAIN_URL} onChange={handleChange} helpText="EXTREMELY IMPORTANT: Your public facing URL (e.g., https://post.example.com). This MUST match the Public Hostname you configure in Cloudflare Zero Trust. Make sure to include https:// and DO NOT include a trailing slash." />
            {mainUrlError && (
                <div className="col-span-full -mt-2 mb-6 px-4 py-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-semibold">
                    {mainUrlError}
                </div>
            )}

            <div className="col-span-full opacity-60 saturate-50 pointer-events-none relative">
                <div className="absolute inset-0 bg-slate-900/10 z-10 rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormGroup label="Frontend Domain URL" name="FRONTEND_URL" placeholder="https://app.postiz.com" value={config.FRONTEND_URL} onChange={handleChange} helpText="Auto-assigned based on your Public Domain URL." />
                <FormGroup label="Backend API URL" name="NEXT_PUBLIC_BACKEND_URL" placeholder="https://app.postiz.com/api" value={config.NEXT_PUBLIC_BACKEND_URL} onChange={handleChange} helpText="Auto-assigned based on your Public Domain URL." />
                </div>
            </div>
            <FormGroup label="Docker Port" name="POSTIZ_PORT" placeholder="4007" value={config.POSTIZ_PORT} onChange={handleChange} helpText="EXTREMELY IMPORTANT: This is the port your app will run on locally. When you set up your Public Hostname in Cloudflare, you MUST point it to: http://localhost:PORT (Default is 4007)." />
            <div className="col-span-full mb-6 bg-white/5 backdrop-blur-sm p-6 border border-white/5 rounded-3xl relative group/input hover:bg-white/10 transition-all duration-500">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center group-hover/input:text-blue-400 transition-colors">
                        JWT Secret Hash
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowJwtSecret(prev => !prev)}
                        className="text-[9px] font-bold text-blue-400/70 hover:text-blue-300 flex items-center bg-blue-500/5 px-3 py-1 rounded-full transition-all border border-blue-500/10 hover:border-blue-500/30"
                    >
                        {showJwtSecret ? <EyeOff className="w-3 h-3 mr-1.5" /> : <Eye className="w-3 h-3 mr-1.5" />}
                        {showJwtSecret ? 'Hide JWT String' : 'View JWT String'}
                    </button>
                </div>

                <div className="relative">
                    <input
                        type={showJwtSecret ? 'text' : 'password'}
                        name="JWT_SECRET"
                        value={config.JWT_SECRET || ''}
                        onChange={handleChange}
                        placeholder="Random alphanumeric string"
                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 px-5 text-slate-100 placeholder-slate-700 focus:outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium shadow-2xl"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-blue-500/20 opacity-0 blur-xl -z-10 transition-opacity duration-500 pointer-events-none group-focus-within/input:opacity-100"></div>
                </div>

                <div className="mt-4 flex gap-3 items-start">
                    <div className="w-1 h-full min-h-[1.5rem] bg-slate-800 rounded-full group-hover/input:bg-blue-500/30 transition-colors"></div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                        A securely randomly generated string used for hashing user sessions.
                    </p>
                </div>
            </div>
            <ToggleSwitch label="Is General (Multi-Tenant Mode)" name="IS_GENERAL" value={config.IS_GENERAL} onChange={handleChange} helpText="ON: Standard SaaS mode — multiple clients can each manage their own separate brands/workspaces. OFF: Locks the entire platform to one single business only." />
            <ToggleSwitch label="Disable Registration" name="DISABLE_REGISTRATION" value={config.DISABLE_REGISTRATION} onChange={handleChange} helpText="ON: Blocks visitors from self-registering. Turn ON after creating your first admin account so only invited clients can join." />
        </Section>
    );
};
