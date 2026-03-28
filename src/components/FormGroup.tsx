import { useState } from 'react';
import { Eye, EyeOff, HelpCircle } from 'lucide-react';

export const FormGroup = ({ label, name, type = "text", placeholder = "", autoFocus = false, value, onChange, helpText, helpLink }: any) => {
    const [showValue, setShowValue] = useState(false);
    const isPasswordField = type === 'password';
    const inputType = isPasswordField ? (showValue ? 'text' : 'password') : type;

    return (
        <div className="mb-6 bg-white/5 backdrop-blur-sm p-6 border border-white/5 rounded-3xl relative group/input hover:bg-white/10 transition-all duration-500">
            <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center group-hover/input:text-blue-400 transition-colors">
                    {label}
                </label>
                <div className="flex items-center gap-2">
                    {isPasswordField && (
                        <button
                            type="button"
                            onClick={() => setShowValue(prev => !prev)}
                            className="text-[9px] font-bold text-blue-400/60 hover:text-blue-400 flex items-center bg-blue-500/5 px-3 py-1 rounded-full transition-all border border-blue-500/10 hover:border-blue-500/30"
                        >
                            {showValue ? <EyeOff className="w-3 h-3 mr-1.5" /> : <Eye className="w-3 h-3 mr-1.5" />}
                            {showValue ? 'Hide Value' : 'View Value'}
                        </button>
                    )}
                    {helpLink && (
                        <a
                            href={helpLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[9px] font-bold text-blue-400/60 hover:text-blue-400 flex items-center bg-blue-500/5 px-3 py-1 rounded-full transition-all border border-blue-500/10 hover:border-blue-500/30"
                        >
                            <HelpCircle className="w-3 h-3 mr-1.5" /> Documentation
                        </a>
                    )}
                </div>
            </div>

            <div className="relative">
                <input
                    type={inputType}
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 px-5 text-slate-100 placeholder-slate-700 focus:outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium shadow-2xl"
                />
                {/* Input focus glow */}
                <div className="absolute inset-0 rounded-2xl bg-blue-500/20 opacity-0 blur-xl -z-10 transition-opacity duration-500 pointer-events-none group-focus-within/input:opacity-100"></div>
            </div>

            {helpText && (
                <div className="mt-4 flex gap-3 items-start">
                    <div className="w-1 h-full min-h-[1.5rem] bg-slate-800 rounded-full group-hover/input:bg-blue-500/30 transition-colors"></div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                        {helpText}
                    </p>
                </div>
            )}
        </div>
    );
};
