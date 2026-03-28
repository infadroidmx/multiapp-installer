import { Section } from '../../../components/Section';
import { FormGroup } from '../../../components/FormGroup';
import { Server, Info, ShieldCheck } from 'lucide-react';

export const XuiCoreSettings = ({ config, handleChange }: any) => {
    return (
        <Section title="Module 1: Remote Gateway" icon={Server} layout="stack">
            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormGroup
                    label="Host Address"
                    name="serverHost"
                    value={config.serverHost}
                    onChange={handleChange}
                    placeholder="e.g. 159.203.18.42"
                    helpText="Target IPv4/IPv6 for the XUI binary rollout. Clean Ubuntu 20.04+ required."
                />
                <FormGroup
                    label="SSH Root User"
                    name="serverUser"
                    value={config.serverUser || 'root'}
                    onChange={handleChange}
                    placeholder="root"
                    helpText="Deployment requires root privileges for PHP compilation and MySQL setup."
                />
                <FormGroup
                    label="SSH Access Key"
                    name="serverPassword"
                    value={config.serverPassword}
                    onChange={handleChange}
                    type="password"
                    placeholder="••••••••"
                    helpText="Encrypted key for temporary script execution/remote writing."
                />
                <FormGroup
                    label="Target Database"
                    name="xuiDatabase"
                    value={config.xuiDatabase || 'xui'}
                    onChange={handleChange}
                    placeholder="xui"
                    helpText="Unique schema name for the XUI portal. Migration logic will create this."
                />
            </div>

            <div className="col-span-full mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-900/50 border border-white/5 rounded-2xl flex items-start gap-4">
                    <Info className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                    <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-2">Host Requirements</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            XUI requires a <strong className="text-slate-300">Clean Ubuntu Server</strong>. This installer will perform a destructive setup of MariaDB and build PHP 7.4.33 from source. Avoid running this on servers with existing web stacks.
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-slate-900/50 border border-white/5 rounded-2xl flex items-start gap-4">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 mt-1 shrink-0" />
                    <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-2">SSH Connectivity</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            Ensure your SSH user has <strong className="text-slate-300">Root / Sudo</strong> privileges. The app will use this connection once to write the installation scripts and then execute the build sequence remotely.
                        </p>
                    </div>
                </div>
            </div>
        </Section>
    );
};
