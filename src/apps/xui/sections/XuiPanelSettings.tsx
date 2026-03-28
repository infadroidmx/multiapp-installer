import { Section } from '../../../components/Section';
import { FormGroup } from '../../../components/FormGroup';
import { ToggleSwitch } from '../../../components/ToggleSwitch';
import { Zap, Globe, Cpu, Database } from 'lucide-react';

export const XuiPanelSettings = ({ config, handleChange }: any) => {
    return (
        <Section title="Module 2: Traffic Control" icon={Zap} layout="stack">
            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormGroup
                    label="Panel Port"
                    name="xuiPort"
                    value={config.xuiPort || '80'}
                    onChange={handleChange}
                    placeholder="80"
                    helpText="Public gateway for the XUI management interface."
                />
                <FormGroup
                    label="Admin Alias"
                    name="adminAlias"
                    value={config.adminAlias || 'admin'}
                    onChange={handleChange}
                    placeholder="admin"
                    helpText="Customized path for the administrative backend (e.g. /admin)."
                />
                <ToggleSwitch
                    label="BBR Optimization"
                    name="enableBBR"
                    value={config.enableBBR || 'true'}
                    onChange={handleChange}
                    helpText="High-performance network congestion control for better stream quality."
                />
                <ToggleSwitch
                    label="Automated Redis"
                    name="enableRedis"
                    value={config.enableRedis || 'true'}
                    onChange={handleChange}
                    helpText="Layered caching for lower latencies during peak traffic."
                />
            </div>

            <div className="col-span-full mt-8 space-y-6">
                <div className="p-6 bg-slate-900/50 border border-white/5 rounded-2xl flex items-start gap-4">
                    <Cpu className="w-5 h-5 text-purple-400 mt-1 shrink-0" />
                    <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-2">Performance Stack</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            <strong className="text-slate-300">BBR (Bottleneck Bandwidth and RTT)</strong> is a state-of-the-art congestion control algorithm by Google that increases throughput and reduces latency for streaming traffic. Highly recommended for VPN use-cases.
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-slate-900/50 border border-white/5 rounded-2xl flex items-start gap-4">
                    <Database className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                    <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-2">MySQL & Redis Coexistence</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            XUI uses <strong className="text-white">MariaDB</strong> for its primary metadata and <strong className="text-white">Redis</strong> for high-speed protocol session management. This installer handles the complex pooling and optimization of both engines.
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-4">
                    <Globe className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                        The panel will automatically configure <strong className="text-white">NGINX</strong> and <strong className="text-white">SSL</strong> if the host matches a valid FQDN. Ensure your A-Records are pointing to the Host Address before initiating the Full Rollout.
                    </p>
                </div>
            </div>
        </Section>
    );
};
