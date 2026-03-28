import React from 'react';

export const ToggleSwitch = ({ label, name, value, onChange, helpText }: any) => {
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
        <div className="mb-6 bg-white/5 backdrop-blur-sm p-6 border border-white/5 rounded-3xl relative group/toggle hover:bg-white/10 transition-all duration-500 flex flex-col justify-center">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] cursor-pointer group-hover/toggle:text-blue-400 transition-colors" onClick={handleToggle}>
                    {label}
                </label>
                <div
                    onClick={handleToggle}
                    className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-all duration-500 ease-in-out flex items-center shadow-2xl border ${isChecked ? 'bg-blue-600 border-blue-400/50 shadow-blue-500/20' : 'bg-slate-950 border-white/5'}`}
                >
                    <div className={`bg-white w-5 h-5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.4)] transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${isChecked ? 'translate-x-7 scale-110' : 'translate-x-0'}`}></div>
                </div>
            </div>
            {helpText && (
                <div className="mt-4 flex gap-3 items-start">
                    <div className="w-1 h-full min-h-[1.5rem] bg-slate-800 rounded-full group-hover/toggle:bg-blue-500/30 transition-colors"></div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                        {helpText}
                    </p>
                </div>
            )}
        </div>
    );
};
