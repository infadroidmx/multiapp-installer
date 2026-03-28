import { useState, useEffect } from 'react';
import { LayoutGrid, Rocket, Settings, Github, Monitor, ShieldCheck, ChevronRight, CheckCircle2, Shield, Film } from 'lucide-react';
import PostizManager from './apps/postiz/PostizManager';
import XuiManager from './apps/xui/XuiManager';
import MediaManager from './apps/media/MediaManager';
import ServerGuisManager from './apps/serverguis/ServerGuisManager';

type AppId = 'postiz' | 'xui' | 'media' | 'serverguis' | 'ghost' | null;

interface AppCardProps {
    id: AppId;
    name: string;
    description: string;
    features: string[];
    image: string;
    color: string;
    status: 'Ready' | 'New' | 'Planned';
    onSelect: (id: AppId) => void;
}

const AppCard = ({ id, name, description, features, image, color, status, onSelect }: AppCardProps) => {
    const isReady = status === 'Ready' || status === 'New';

    return (
        <div
            onClick={() => isReady && onSelect(id)}
            className={`group relative flex flex-col bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-700 hover:scale-[1.03] hover:-translate-y-3 ${isReady ? 'cursor-pointer hover:border-blue-500/40 hover:shadow-[0_40px_80px_-20px_rgba(30,58,138,0.4)]' : 'opacity-75 grayscale cursor-not-allowed'}`}
        >
            {/* Hero Image Section */}
            <div className="relative h-64 overflow-hidden">
                <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

                {/* Status Badge */}
                <div className={`absolute top-6 left-6 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md ${isReady ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-slate-800/50 text-slate-500 border-white/5'}`}>
                    {status}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-3xl font-black tracking-tighter text-white group-hover:text-blue-400 transition-colors uppercase italic">
                        {name}
                    </h3>
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} shadow-lg ring-1 ring-white/20 group-hover:scale-110 transition-transform duration-500`}>
                        {id === 'postiz' && <Rocket className="w-5 h-5 text-white" />}
                        {id === 'xui' && <Shield className="w-5 h-5 text-white" />}
                        {id === 'media' && <Film className="w-5 h-5 text-white" />}
                        {id === 'serverguis' && <Monitor className="w-5 h-5 text-white" />}
                        {id === 'ghost' && <Github className="w-5 h-5 text-white" />}
                    </div>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                    {description}
                </p>

                {/* Features List */}
                <div className="space-y-3 mb-8 flex-1">
                    {features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-xs font-semibold text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500/70" />
                            {feature}
                        </div>
                    ))}
                </div>

                {/* Footer Action */}
                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        System Module v1.0
                    </div>
                    {isReady ? (
                        <div className="flex items-center gap-2 text-xs font-black text-blue-400 group-hover:translate-x-2 transition-transform duration-500">
                            INITIALIZE <ChevronRight className="w-4 h-4" />
                        </div>
                    ) : (
                        <div className="text-xs font-bold text-slate-600 italic">
                            Awaiting Update
                        </div>
                    )}
                </div>
            </div>

            {/* Hover Glow Effect */}
            <div className={`absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-1000 blur-[80px] pointer-events-none`}></div>
        </div>
    );
};

export default function App() {
    const [selectedApp, setSelectedApp] = useState<AppId>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setTimeout(() => setIsLoaded(true), 100);
    }, []);

    if (selectedApp === 'postiz') {
        return <PostizManager onBack={() => setSelectedApp(null)} />;
    }

    if (selectedApp === 'xui') {
        return <XuiManager onBack={() => setSelectedApp(null)} />;
    }

    if (selectedApp === 'media') {
        return <MediaManager onBack={() => setSelectedApp(null)} />;
    }

    if (selectedApp === 'serverguis') {
        return <ServerGuisManager onBack={() => setSelectedApp(null)} />;
    }

    const apps = [
        {
            id: 'postiz' as AppId,
            name: 'Postiz',
            description: 'Premium Social Media Automation & Scheduling Engine',
            features: ['Docker Management', 'SSH Auto-Scaffolding', 'Cloudflare Tunnels', 'Multi-tenant Support'],
            image: 'assets/apps/postiz.png',
            color: 'from-blue-600 to-indigo-600',
            status: 'Ready' as const
        },
        {
            id: 'xui' as AppId,
            name: 'XUI One',
            description: 'Elite High-Performance VPN & Proxy Management Portal',
            features: ['BBR Optimization', 'PHP 7.4 Source Build', 'MariaDB Provisioning', 'License Auto-Crack'],
            image: 'assets/apps/xui.png',
            color: 'from-purple-600 to-purple-800',
            status: 'New' as const
        },
        {
            id: 'media' as AppId,
            name: 'Media Stack',
            description: 'Self-Hosted Media Automation Suite with Selectable Services',
            features: ['Per-Service Port Mapping', 'Service Selection', 'Docker Compose V2', 'SABnzbd External Access'],
            image: 'assets/apps/postiz.png',
            color: 'from-orange-500 to-red-600',
            status: 'New' as const
        },
        {
            id: 'serverguis' as AppId,
            name: 'Server GUIs',
            description: 'Convert Headless Linux Servers to Remote Desktops',
            features: ['OS Auto-Detection', 'Multiple OS Support', 'RDP Auto-Configuration', 'GUI Removal Tool'],
            image: 'assets/apps/serverguis.png',
            color: 'from-cyan-500 to-blue-600',
            status: 'New' as const
        },
        {
            id: 'ghost' as AppId,
            name: 'Ghost CMS',
            description: 'Professional Publishing & Membership Platform',
            features: ['Node.js Backend', 'Theme Management', 'Newsletter Engine', 'Custom Domain Support'],
            image: 'assets/apps/ghost.png',
            color: 'from-emerald-500 to-teal-600',
            status: 'Planned' as const
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px]"></div>
            </div>

            <div className={`transition-all duration-1000 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} relative z-10 px-6 py-12 md:px-12 md:py-20 lg:px-24`}>

                {/* Header */}
                <header className="max-w-7xl mx-auto mb-20 flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-3.5 rounded-[1.25rem] shadow-2xl shadow-blue-500/20 ring-1 ring-white/20">
                                <LayoutGrid className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black tracking-[0.4em] text-blue-400 uppercase block mb-0.5">Unified Deployment</span>
                                <span className="text-white/60 text-xs font-bold uppercase tracking-widest">System Core v1.0.4</span>
                            </div>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 mb-8 leading-[0.9]">
                            Control Center
                        </h1>
                        <p className="text-slate-400 text-lg md:text-xl leading-relaxed font-medium">
                            The ultimate environment for deploying and scaling self-hosted infrastructure. Pick a module to begin configuration.
                        </p>
                    </div>

                    <div className="flex flex-col gap-6 md:items-end">
                        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-2xl border border-white/10 p-3 rounded-2xl">
                            <div className="px-5 py-2.5 flex items-center gap-2.5 text-xs font-bold text-slate-300 border-r border-white/10">
                                <Monitor className="w-4 h-4 text-blue-400" /> CLUSTER ACTIVE
                            </div>
                            <div className="px-5 py-2.5 flex items-center gap-2.5 text-xs font-bold text-emerald-400">
                                <ShieldCheck className="w-4 h-4" /> SECURE ROOT
                            </div>
                        </div>

                        <div className="flex items-center gap-6 pr-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Server</span>
                                <span className="text-sm font-mono text-slate-300">sh-cluster-01.local</span>
                            </div>
                            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-blue-500/10">
                                <Settings className="w-5 h-5 text-blue-400 animate-spin-slow" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Subtitle / Divider */}
                <div className="max-w-7xl mx-auto mb-12 flex items-center gap-8">
                    <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">
                        Primary Infrastructure Modules
                    </h2>
                    <div className="h-px bg-gradient-to-r from-white/10 to-transparent w-full"></div>
                </div>

                {/* App Grid */}
                <main className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {apps.map((app) => (
                            <AppCard
                                key={app.id}
                                {...app}
                                onSelect={setSelectedApp}
                            />
                        ))}
                    </div>
                </main>

                {/* Footer */}
                <footer className="max-w-7xl mx-auto mt-32 pt-16 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-blue-600"></div>
                            <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-purple-600"></div>
                            <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-red-600"></div>
                            <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-cyan-600"></div>
                        </div>
                        <span>4 Modules Available</span>
                    </div>

                    <div className="flex items-center space-x-12">
                        <a href="#" className="hover:text-blue-400 transition-colors">Documentation</a>
                        <a href="#" className="hover:text-blue-400 transition-colors italic">Huezorises LLC</a>
                    </div>
                </footer>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
            `}} />
        </div>
    );
}
