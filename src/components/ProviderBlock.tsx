export const ProviderBlock = ({ title, isActive, onToggle, children }: any) => {
    return (
        <div className={`col-span-1 lg:col-span-2 xl:col-span-3 mb-8 bg-white/5 backdrop-blur-md rounded-[2rem] border transition-all duration-700 ${isActive ? 'border-blue-500/30 shadow-[0_24px_48px_-12px_rgba(59,130,246,0.15)] bg-blue-500/5' : 'border-white/5 hover:bg-white/10 shadow-xl'}`}>
            <div
                className="p-6 flex items-center justify-between cursor-pointer group/prov"
                onClick={onToggle}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full transition-all duration-500 ${isActive ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]' : 'bg-slate-700'}`}></div>
                    <h3 className={`font-black text-xl uppercase italic tracking-tighter transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover/prov:text-slate-300'}`}>
                        {title}
                    </h3>
                </div>

                <div
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                    className={`w-14 h-7 rounded-full p-1 transition-all duration-500 ease-in-out flex items-center shadow-2xl border ${isActive ? 'bg-blue-600 border-blue-400/50 shadow-blue-500/20' : 'bg-slate-950 border-white/5'}`}
                >
                    <div className={`bg-white w-5 h-5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.4)] transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${isActive ? 'translate-x-7 scale-110' : 'translate-x-0'}`}></div>
                </div>
            </div>
            {isActive && (
                <div className="p-8 border-t border-white/5 bg-slate-950/40 rounded-b-[2rem] animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};
