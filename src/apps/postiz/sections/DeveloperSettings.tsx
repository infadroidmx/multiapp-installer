import { Terminal } from 'lucide-react';
import { Section } from '../../../components/Section';
import { FormGroup } from '../../../components/FormGroup';

export const DeveloperSettings = ({ config, handleChange }: any) => {
    const images = [
        { id: 'ghcr.io/gitroomhq/postiz-app:latest', label: 'Official (gitroomhq)', color: 'blue' },
        { id: 'ghcr.io/infadroidmx/infinate-posts:latest', label: 'Custom (infinate-posts)', color: 'indigo' }
    ];

    return (
        <Section
            title="8. Developer Settings"
            icon={Terminal}
            description="Additional developer settings, including selecting which Postiz Docker image to deploy."
        >
            <div className="col-span-1 lg:col-span-2 xl:col-span-3 mb-8">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block">
                    Postiz Docker Image
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {images.map((img) => (
                        <button
                            key={img.id}
                            type="button"
                            onClick={() => handleChange({ target: { name: 'POSTIZ_IMAGE', value: img.id } })}
                            className={`p-6 rounded-3xl border text-left transition-all duration-500 group relative overflow-hidden ${
                                config.POSTIZ_IMAGE === img.id
                                    ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_20px_40px_-15px_rgba(59,130,246,0.2)]'
                                    : 'border-white/5 bg-white/5 hover:bg-white/10'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-black uppercase italic tracking-tighter ${config.POSTIZ_IMAGE === img.id ? 'text-blue-400' : 'text-slate-500'}`}>
                                    {img.label}
                                </span>
                                <div className={`w-3 h-3 rounded-full ${config.POSTIZ_IMAGE === img.id ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]' : 'bg-slate-700'}`}></div>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono break-all opacity-60">
                                {img.id}
                            </p>
                            
                            {config.POSTIZ_IMAGE === img.id && (
                                <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none"></div>
                            )}
                        </button>
                    ))}
                </div>
                <p className="mt-4 text-[11px] text-slate-500 italic">
                    Choose between the official GitroomHQ image or the customized infinate-posts image for your deployment.
                </p>
            </div>

            <FormGroup 
                label="NX PLUGINS" 
                name="NX_ADD_PLUGINS" 
                value={config.NX_ADD_PLUGINS} 
                onChange={handleChange} 
                helpText="A comma-separated list of extra Nx plugins to install upon deployment. Generally not needed." 
            />
        </Section>
    );
};
