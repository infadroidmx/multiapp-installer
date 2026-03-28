import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { ActivityItem } from '../utils/activityHistory';

type FilterMode = 'all' | 'error';

function formatTime(timestamp: number) {
    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(timestamp));
}

export function ActivityHistoryPanel({
    items,
    title = 'Recent Activity',
    accentClassName,
    onClearHistory
}: {
    items: ActivityItem[];
    title?: string;
    accentClassName?: string;
    onClearHistory?: () => void;
}) {
    const [filter, setFilter] = useState<FilterMode>('all');

    const statusClass = (status: ActivityItem['status']) => {
        if (status === 'success') return 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10';
        if (status === 'error') return 'text-rose-300 border-rose-500/25 bg-rose-500/10';
        return 'text-slate-300 border-white/15 bg-white/5';
    };

    const displayed = filter === 'error' ? items.filter((i) => i.status === 'error') : items;
    const errorCount = items.filter((i) => i.status === 'error').length;

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 md:p-8 mb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-black uppercase tracking-widest text-xs">{title}</h3>
                <div className="flex items-center gap-2">
                    {onClearHistory && items.length > 0 && (
                        <button
                            type="button"
                            onClick={onClearHistory}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all"
                            title="Clear history for this profile"
                        >
                            <Trash2 className="w-3 h-3" /> Clear
                        </button>
                    )}
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${accentClassName || 'text-slate-300 border-white/20 bg-white/5'}`}>
                        {items.length} events
                    </span>
                </div>
            </div>

            {/* Filter tabs */}
            {items.length > 0 && (
                <div className="flex gap-2 mb-4">
                    {(['all', 'error'] as FilterMode[]).map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => setFilter(mode)}
                            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                filter === mode
                                    ? (mode === 'error' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : `${accentClassName || 'bg-white/10 border-white/20 text-white'}`)
                                    : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {mode === 'error' ? `Errors (${errorCount})` : `All (${items.length})`}
                        </button>
                    ))}
                </div>
            )}

            {displayed.length === 0 ? (
                <p className="text-xs text-slate-500">
                    {items.length === 0 ? 'No events recorded for this profile yet.' : 'No errors recorded.'}
                </p>
            ) : (
                <div className="space-y-2">
                    {displayed.map((item) => (
                        <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs text-slate-200 font-bold uppercase tracking-wide">{item.action}</p>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusClass(item.status)}`}>
                                    {item.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{item.message}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{formatTime(item.timestamp)}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
