import { useState } from 'react';
import { Section } from '../../../components/Section';
import { FormGroup } from '../../../components/FormGroup';
import { Shield, HelpCircle, BookOpen, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export const CloudflareTunnel = ({ config, handleChange }: any) => {
    const [showGuide, setShowGuide] = useState(false);
    const xuiPort = Number(config.xuiPort || '80') || 80;

    return (
        <Section title="Module 0: Gateway Access" icon={Shield} layout="stack">
            <div className="col-span-full grid grid-cols-1 gap-8">
                <FormGroup
                    label="Cloudflare Tunnel Token"
                    name="cloudflareToken"
                    value={config.cloudflareToken}
                    onChange={handleChange}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    helpText="Paste only the token from: cloudflared service install <TOKEN>. One token can route multiple app hostnames."
                />
            </div>

            <button
                type="button"
                onClick={() => setShowGuide(prev => !prev)}
                className="col-span-full mt-6 w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-300 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-2xl py-3 transition-all"
            >
                {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showGuide ? 'Hide Cloudflare Setup Guide' : 'Show Cloudflare Setup Guide'}
            </button>

            {showGuide && (
                <div className="col-span-full mt-6 p-6 bg-slate-950/60 border border-blue-500/15 rounded-2xl space-y-3">
                    <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">Exact Steps (Generic)</p>
                    <p className="text-xs text-slate-400">1) Zero Trust → Networks → Tunnels → Create tunnel</p>
                    <p className="text-xs text-slate-400">2) Connector: Cloudflared, Environment: Linux, then Save</p>
                    <p className="text-xs text-slate-400">3) Copy token from command: cloudflared service install &lt;TOKEN&gt;</p>
                    <p className="text-xs text-slate-400">4) Paste token here and run deployment</p>
                    <p className="text-xs text-slate-400">5) Add Public Hostname using values below</p>

                    <div className="mt-3 p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl space-y-1">
                        <p className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">Public Hostname values for XUI</p>
                        <p className="text-xs text-slate-400">Subdomain: <span className="text-white">xui</span></p>
                        <p className="text-xs text-slate-400">Domain: <span className="text-white">yourdomain.com</span></p>
                        <p className="text-xs text-slate-400">Path: <span className="text-white">(leave empty)</span></p>
                        <p className="text-xs text-slate-400">Service type: <span className="text-white">HTTP</span></p>
                        <p className="text-xs text-slate-400">URL: <span className="text-white">localhost:{xuiPort}</span></p>
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

            <div className="col-span-full mt-8 space-y-6">
                <div className="p-6 bg-purple-500/5 border border-purple-500/10 rounded-2xl flex items-start gap-4">
                    <HelpCircle className="w-5 h-5 text-purple-400 mt-1 shrink-0" />
                    <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-2">What is this?</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                            Cloudflare Tunnels create a secure, encrypted connection between your local server and the Cloudflare edge. This allows you to expose your XUI panel to the internet <strong className="text-white">without opening any ports</strong> on your router or firewall.
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-4">
                    <BookOpen className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                    <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-2">Setup Guide</h4>
                        <ul className="text-[10px] text-slate-400 space-y-2 list-disc ml-4 font-medium">
                            <li>Log in to your <strong>Cloudflare Dashboard</strong> and go to <strong className="text-blue-400">Zero Trust</strong>.</li>
                            <li>Navigate to <strong>Networks &gt; Tunnels</strong> and click 'Create a Tunnel'.</li>
                            <li>Select 'Cloudflared' as the connector and give it a name.</li>
                            <li>Copy the <strong>Token</strong> from the 'Install and run a connector' section (usually part of the docker/linux command).</li>
                            <li>Paste that token here. The app will handle the rest of the installation.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </Section>
    );
};
