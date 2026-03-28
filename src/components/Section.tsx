import { ArrowUpRight } from 'lucide-react';

export const Section = ({ title, icon: Icon, description, helpLink, children, layout = 'form-grid', contentClassName = '' }: any) => {
    const layoutClassName = layout === 'stack'
        ? 'grid grid-cols-1 gap-8'
        : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8';

    return (
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 border border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] mb-12 relative overflow-hidden group/section">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] -z-10 -mr-48 -mt-48 transition-opacity duration-1000 group-hover/section:opacity-20"></div>

            <div className="mb-10 flex flex-col border-b border-white/5 pb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl shadow-2xl ring-1 ring-white/10 group-hover/section:scale-110 transition-transform duration-500">
                            <Icon className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
                                {title}
                            </h2>
                            <div className="h-1 w-12 bg-blue-500/50 rounded-full mt-1 group-hover/section:w-20 transition-all duration-700"></div>
                        </div>
                    </div>

                    {helpLink && (
                        <a
                            href={helpLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 px-5 py-2 rounded-full transition-all"
                        >
                            <ArrowUpRight className="w-3.5 h-3.5 mr-2" />
                            Component Guide
                        </a>
                    )}
                </div>

                {description && (
                    <p className="text-slate-400 text-sm mt-6 max-w-3xl leading-relaxed font-medium">
                        {description}
                    </p>
                )}
            </div>

            <div className={`${layoutClassName} ${contentClassName}`.trim()}>
                {children}
            </div>
        </div>
    );
};
