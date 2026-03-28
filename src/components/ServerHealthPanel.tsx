interface ServerHealthPanelProps {
    health: any;
    accentClassName?: string;
    title?: string;
}

export function ServerHealthPanel({
    health,
    accentClassName = 'text-blue-400 border-blue-500/20 bg-blue-500/10',
    title = 'Server Health'
}: ServerHealthPanelProps) {
    if (!health) {
        return null;
    }

    const localIps = Array.isArray(health.localIps) && health.localIps.length > 0
        ? health.localIps.join(', ')
        : 'Unavailable';

    const statusRows = [
        ['Hostname', health.hostname || 'Unavailable'],
        ['OS', health.os || 'Unavailable'],
        ['Kernel', health.kernel || 'Unavailable'],
        ['Uptime', health.uptime || 'Unavailable'],
        ['Load', health.loadAverage || 'Unavailable'],
        ['Memory', health.memorySummary || 'Unavailable'],
        ['Disk /', health.diskUsage || 'Unavailable'],
        ['Local IPs', localIps],
        ['Docker', health.dockerInstalled ? (health.dockerStatus || 'installed') : 'not installed'],
        ['Cloudflare', health.cloudflareStatus || 'inactive']
    ];

    if (health.configuredPort) {
        statusRows.push([
            'Configured Port',
            `${health.configuredPort} (${health.configuredPortStatus === 'listening' ? 'listening' : 'not listening'})`
        ]);
    }

    return (
        <div className="mb-8 bg-slate-900/50 border border-white/10 rounded-[2rem] p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl border ${accentClassName}`}>
                    <div className="w-4 h-4 rounded-full bg-current opacity-80" />
                </div>
                <div>
                    <h3 className="text-white text-xs font-black uppercase tracking-widest">{title}</h3>
                    <p className="text-[11px] text-slate-500">Last checked: {new Date(health.checkedAt || Date.now()).toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {statusRows.map(([label, value]) => (
                    <div key={label} className="border border-white/5 rounded-xl px-3 py-3 bg-black/20 min-w-0">
                        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] mb-1">{label}</p>
                        <p className="text-slate-200 font-semibold break-words">{value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}