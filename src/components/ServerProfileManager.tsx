import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, Pencil, Plus, Server, Trash2, Upload, X } from 'lucide-react';

const APP_COMPAT_KEYS: Record<'media' | 'postiz' | 'xui' | 'serverguis' | 'ghost', string[]> = {
    media: [
        'serverHost',
        'serverUser',
        'serverPassword',
        'mediaTimezone',
        'mediaPuid',
        'mediaPgid',
        'mediaStackDir',
        'cloudflareEnabled',
        'cloudflareToken',
        'mediaServices',
        'mediaPorts'
    ],
    postiz: [
        'serverHost',
        'serverUser',
        'serverPassword',
        'MAIN_URL',
        'POSTIZ_PORT',
        'JWT_SECRET',
        'CLOUDFLARE_TOKEN',
        'FRONTEND_URL',
        'NEXT_PUBLIC_BACKEND_URL',
        'STORAGE_PROVIDER'
    ],
    xui: [
        'serverHost',
        'serverUser',
        'serverPassword',
        'xuiDatabase',
        'xuiPort',
        'adminAlias',
        'enableBBR',
        'enableRedis',
        'cloudflareToken'
    ],
    serverguis: [
        'serverHost',
        'serverUser',
        'serverPassword',
        'selectedGui'
    ],
    ghost: []
};

const APP_CRITICAL_KEYS: Record<'media' | 'postiz' | 'xui' | 'serverguis' | 'ghost', string[]> = {
    media: ['serverHost', 'serverUser', 'serverPassword', 'mediaStackDir', 'mediaServices'],
    postiz: ['serverHost', 'serverUser', 'serverPassword', 'MAIN_URL', 'POSTIZ_PORT'],
    xui: ['serverHost', 'serverUser', 'serverPassword', 'xuiPort', 'adminAlias'],
    serverguis: ['serverHost', 'serverUser', 'serverPassword'],
    ghost: []
};

const APP_SAMPLE_CONFIG: Record<'media' | 'postiz' | 'xui' | 'serverguis' | 'ghost', any> = {
    media: {
        serverHost: '192.168.1.100',
        serverUser: 'root',
        serverPassword: 'change-me',
        mediaTimezone: 'UTC',
        mediaPuid: '1000',
        mediaPgid: '1000',
        mediaStackDir: '/root/media-stack',
        cloudflareEnabled: false,
        cloudflareToken: '',
        mediaServices: {
            portainer: true,
            sabnzbd: true,
            deluge: true,
            jackett: true,
            flaresolverr: true,
            radarr: true,
            sonarr: true,
            profilarr: true,
            requesterr: true,
            watchtower: true
        },
        mediaPorts: {
            portainer: '9000',
            sabnzbd: '8080',
            deluge: '8112',
            jackett: '9117',
            flaresolverr: '8191',
            radarr: '7878',
            sonarr: '8989',
            profilarr: '6868',
            requesterr: '4545'
        }
    },
    postiz: {
        serverHost: '192.168.1.100',
        serverUser: 'root',
        serverPassword: 'change-me',
        MAIN_URL: 'https://postiz.example.com',
        FRONTEND_URL: 'https://postiz.example.com',
        NEXT_PUBLIC_BACKEND_URL: 'https://postiz.example.com/api',
        POSTIZ_PORT: '4007',
        JWT_SECRET: 'replace-with-long-random-secret',
        CLOUDFLARE_TOKEN: '',
        STORAGE_PROVIDER: 'local',
        UPLOAD_DIRECTORY: '/uploads',
        NEXT_PUBLIC_UPLOAD_DIRECTORY: '/uploads'
    },
    xui: {
        serverHost: '192.168.1.100',
        serverUser: 'root',
        serverPassword: 'change-me',
        xuiDatabase: 'xui',
        xuiPort: '80',
        adminAlias: 'admin',
        enableBBR: 'true',
        enableRedis: 'true',
        cloudflareToken: ''
    },
    serverguis: {
        serverHost: '192.168.1.100',
        serverUser: 'root',
        serverPassword: 'change-me',
        selectedGui: 'xfce'
    },
    ghost: {}
};

interface ServerProfileManagerProps {
    profiles: Array<{ id: string; name: string }>;
    activeProfileId: string;
    onSelectProfile: (profileId: string) => void;
    onCreateProfile: (name: string) => void;
    onDeleteProfile: (profileId: string) => void;
    onRenameProfile?: (profileId: string, newName: string) => void;
    onDuplicateProfile?: (profileId: string, newName: string) => void;
    onExportProfile?: () => void;
    onImportProfile?: (data: any) => void;
    expectedAppId?: 'media' | 'postiz' | 'xui' | 'serverguis' | 'ghost';
    accentClassName?: string;
}

interface JsonErrorLocation {
    line: number;
    column: number;
    position: number;
}

export function ServerProfileManager({
    profiles,
    activeProfileId,
    onSelectProfile,
    onCreateProfile,
    onDeleteProfile,
    onRenameProfile,
    onDuplicateProfile,
    onExportProfile,
    onImportProfile,
    expectedAppId,
    accentClassName = 'text-blue-400 border-blue-500/20 bg-blue-500/10'
}: ServerProfileManagerProps) {
    const [newProfileName, setNewProfileName] = useState('');
    const [renameMode, setRenameMode] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [importNotice, setImportNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [importAcknowledgeEmpty, setImportAcknowledgeEmpty] = useState(false);
    const [importAcknowledgeCriticalMismatch, setImportAcknowledgeCriticalMismatch] = useState(false);
    const [showPasteModal, setShowPasteModal] = useState(false);
    const [pasteJsonValue, setPasteJsonValue] = useState('');
    const [pasteErrorPulse, setPasteErrorPulse] = useState(false);
    const [isReadingClipboard, setIsReadingClipboard] = useState(false);
    const [showDiscardPastePrompt, setShowDiscardPastePrompt] = useState(false);
    const [pendingImport, setPendingImport] = useState<{
        data: any;
        fileName: string;
        profileName: string;
        appId?: string;
        mismatch: boolean;
        keyCount: number;
        keyPreview: string[];
        nameConflict: boolean;
        compatibilityScore: number | null;
        matchedKeys: string[];
        matchedKeyCount: number;
        expectedKeyCount: number;
        criticalKeyCount: number;
        matchedCriticalKeyCount: number;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pasteButtonRef = useRef<HTMLButtonElement>(null);
    const pasteTextareaRef = useRef<HTMLTextAreaElement>(null);
    const pasteClipboardButtonRef = useRef<HTMLButtonElement>(null);
    const pasteCancelButtonRef = useRef<HTMLButtonElement>(null);
    const pasteParseButtonRef = useRef<HTMLButtonElement>(null);
    const discardPasteButtonRef = useRef<HTMLButtonElement>(null);
    const keepEditingButtonRef = useRef<HTMLButtonElement>(null);
    const pasteErrorPulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeProfile = profiles.find((p) => p.id === activeProfileId);

    useEffect(() => {
        if (showPasteModal) {
            pasteTextareaRef.current?.focus();
        }
    }, [showPasteModal]);

    useEffect(() => {
        if (showDiscardPastePrompt) {
            keepEditingButtonRef.current?.focus();
        }
    }, [showDiscardPastePrompt]);

    useEffect(() => {
        return () => {
            if (pasteErrorPulseTimeoutRef.current) {
                clearTimeout(pasteErrorPulseTimeoutRef.current);
            }
        };
    }, []);

    const preparePendingImport = (data: any, sourceLabel: string) => {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('Invalid profile format.');
        }

        const profileName = typeof data.profileName === 'string' && data.profileName.trim()
            ? data.profileName.trim()
            : 'Imported Server';
        const importedConfig = (data && typeof data.config === 'object' && data.config && !Array.isArray(data.config))
            ? data.config
            : data;
        const configKeys = (importedConfig && typeof importedConfig === 'object' && !Array.isArray(importedConfig))
            ? Object.keys(importedConfig)
            : [];
        const fileAppId = typeof data.app === 'string' ? data.app.trim().toLowerCase() : undefined;
        const mismatch = Boolean(expectedAppId && fileAppId && fileAppId !== expectedAppId);
        const normalizedName = profileName.toLowerCase();
        const nameConflict = profiles.some((profile) => profile.name.trim().toLowerCase() === normalizedName);
        const expectedKeys = expectedAppId ? APP_COMPAT_KEYS[expectedAppId] : [];
        const criticalKeys = expectedAppId ? APP_CRITICAL_KEYS[expectedAppId] : [];
        const matchedKeys = expectedKeys.filter((key) => configKeys.includes(key));
        const matchedCriticalKeys = criticalKeys.filter((key) => configKeys.includes(key));
        const totalWeight = expectedKeys.reduce((sum, key) => sum + (criticalKeys.includes(key) ? 3 : 1), 0);
        const matchedWeight = expectedKeys.reduce((sum, key) => {
            if (!configKeys.includes(key)) return sum;
            return sum + (criticalKeys.includes(key) ? 3 : 1);
        }, 0);
        const compatibilityScore = expectedKeys.length > 0
            ? Math.round((matchedWeight / Math.max(totalWeight, 1)) * 100)
            : null;

        setPendingImport({
            data,
            fileName: sourceLabel,
            profileName,
            appId: fileAppId,
            mismatch,
            keyCount: configKeys.length,
            keyPreview: configKeys.slice(0, 6),
            nameConflict,
            compatibilityScore,
            matchedKeys: matchedKeys.slice(0, 6),
            matchedKeyCount: matchedKeys.length,
            expectedKeyCount: expectedKeys.length,
            criticalKeyCount: criticalKeys.length,
            matchedCriticalKeyCount: matchedCriticalKeys.length
        });
        setImportAcknowledgeEmpty(false);
        setImportAcknowledgeCriticalMismatch(false);
        setImportNotice(null);
    };

    const startRename = () => {
        setRenameValue(activeProfile?.name || '');
        setRenameMode(true);
    };

    const commitRename = () => {
        if (onRenameProfile && renameValue.trim()) {
            onRenameProfile(activeProfileId, renameValue.trim());
        }
        setRenameMode(false);
    };

    const cancelRename = () => setRenameMode(false);

    const handleDuplicate = () => {
        if (onDuplicateProfile && activeProfile) {
            onDuplicateProfile(activeProfileId, `${activeProfile.name} (copy)`);
        }
    };

    const downloadSampleImportFile = () => {
        if (!expectedAppId) return;
        const sample = {
            profileName: `${expectedAppId} sample`,
            app: expectedAppId,
            config: APP_SAMPLE_CONFIG[expectedAppId]
        };
        const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${expectedAppId}-profile-sample.json`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        showImportNotice('success', `Downloaded ${expectedAppId} sample profile JSON.`);
    };

    const copySampleImportJson = async () => {
        if (!expectedAppId) return;
        const sample = {
            profileName: `${expectedAppId} sample`,
            app: expectedAppId,
            config: APP_SAMPLE_CONFIG[expectedAppId]
        };
        const text = JSON.stringify(sample, null, 2);

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                showImportNotice('success', `Copied ${expectedAppId} sample JSON to clipboard.`);
                return;
            }

            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            const copied = document.execCommand('copy');
            document.body.removeChild(textarea);

            if (copied) {
                showImportNotice('success', `Copied ${expectedAppId} sample JSON to clipboard.`);
            } else {
                showImportNotice('error', 'Could not copy sample JSON. Use the Sample download instead.');
            }
        } catch {
            showImportNotice('error', 'Could not copy sample JSON. Use the Sample download instead.');
        }
    };

    const showImportNotice = (type: 'success' | 'error', text: string) => {
        setImportNotice({ type, text });
        setTimeout(() => setImportNotice(null), 3500);
    };

    const getJsonErrorLocation = (source: string, error: unknown): JsonErrorLocation | null => {
        if (!(error instanceof SyntaxError) || typeof error.message !== 'string') {
            return null;
        }

        const message = error.message;
        const lineColMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
        if (lineColMatch) {
            const line = Number(lineColMatch[1]);
            const column = Number(lineColMatch[2]);
            if (Number.isFinite(line) && Number.isFinite(column) && line >= 1 && column >= 1) {
                return { line, column, position: -1 };
            }
        }

        const positionMatch = message.match(/position\s+(\d+)/i);
        if (!positionMatch) {
            return null;
        }

        const position = Number(positionMatch[1]);
        if (!Number.isFinite(position) || position < 0 || position > source.length) {
            return null;
        }

        let line = 1;
        let column = 1;
        for (let i = 0; i < position; i += 1) {
            if (source[i] === '\n') {
                line += 1;
                column = 1;
            } else {
                column += 1;
            }
        }

        return { line, column, position };
    };

    const getJsonParseNotice = (baseMessage: string, source: string, error: unknown) => {
        const fallback = `${baseMessage}`;
        const location = getJsonErrorLocation(source, error);
        if (!location) {
            return fallback;
        }

        return `${baseMessage} (line ${location.line}, column ${location.column}).`;
    };

    const confirmImport = () => {
        if (!pendingImport) return;
        if (pendingImport.keyCount === 0 && !importAcknowledgeEmpty) return;
        if (pendingImport.criticalKeyCount > 0 && pendingImport.matchedCriticalKeyCount === 0 && !importAcknowledgeCriticalMismatch) return;
        onImportProfile?.(pendingImport.data);
        showImportNotice('success', `Imported profile from ${pendingImport.fileName}.`);
        setPendingImport(null);
        setImportAcknowledgeEmpty(false);
        setImportAcknowledgeCriticalMismatch(false);
    };

    const cancelImport = () => {
        setPendingImport(null);
        setImportAcknowledgeEmpty(false);
        setImportAcknowledgeCriticalMismatch(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const raw = evt.target?.result;
            try {
                if (typeof raw !== 'string') {
                    throw new Error('File content could not be read.');
                }
                const data = JSON.parse(raw);
                preparePendingImport(data, file.name);
            } catch (error) {
                showImportNotice('error', getJsonParseNotice('Import failed: invalid JSON profile file.', typeof raw === 'string' ? raw : '', error));
                setPendingImport(null);
                setImportAcknowledgeEmpty(false);
                setImportAcknowledgeCriticalMismatch(false);
            }
        };
        reader.onerror = () => {
            showImportNotice('error', 'Import failed: unable to read selected file.');
            setPendingImport(null);
            setImportAcknowledgeEmpty(false);
            setImportAcknowledgeCriticalMismatch(false);
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const openPasteModal = () => {
        setPasteJsonValue('');
        setShowDiscardPastePrompt(false);
        setShowPasteModal(true);
    };

    const closePasteModal = () => {
        setShowPasteModal(false);
        setPasteJsonValue('');
        setShowDiscardPastePrompt(false);
        pasteButtonRef.current?.focus();
    };

    const cancelPasteModal = () => {
        if (pasteJsonValue.trim().length > 0) {
            setShowDiscardPastePrompt(true);
            return;
        }
        closePasteModal();
    };

    const keepEditingPaste = () => {
        setShowDiscardPastePrompt(false);
        pasteTextareaRef.current?.focus();
    };

    const discardPasteAndClose = () => {
        closePasteModal();
    };

    const pasteFromClipboard = async () => {
        try {
            setIsReadingClipboard(true);
            if (!navigator?.clipboard?.readText) {
                showImportNotice('error', 'Clipboard read is not available in this environment.');
                return;
            }
            const text = await navigator.clipboard.readText();
            if (!text.trim()) {
                showImportNotice('error', 'Clipboard is empty.');
                return;
            }
            setPasteJsonValue(text);
            showImportNotice('success', 'Clipboard content pasted into JSON editor.');
        } catch {
            showImportNotice('error', 'Clipboard access denied. Paste manually if needed.');
        } finally {
            setIsReadingClipboard(false);
        }
    };

    const handlePasteImport = () => {
        try {
            const parsed = JSON.parse(pasteJsonValue);
            preparePendingImport(parsed, 'pasted-json');
            closePasteModal();
            return true;
        } catch (error) {
            showImportNotice('error', getJsonParseNotice('Paste import failed: invalid JSON content.', pasteJsonValue, error));
            return false;
        }
    };

    const formatPasteJson = () => {
        try {
            const parsed = JSON.parse(pasteJsonValue);
            setPasteJsonValue(JSON.stringify(parsed, null, 2));
            showImportNotice('success', 'JSON formatted successfully.');
        } catch (error) {
            showImportNotice('error', getJsonParseNotice('Cannot format: pasted content is not valid JSON.', pasteJsonValue, error));
        }
    };

    const handlePasteModalKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            cancelPasteModal();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
            e.preventDefault();
            if (pasteJsonValue.trim()) {
                formatPasteJson();
            }
            return;
        }
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (pasteJsonStatus === 'valid') {
                handlePasteImport();
                return;
            }
            if (pasteJsonStatus === 'invalid') {
                jumpToPasteJsonError();
                showImportNotice('error', 'JSON is invalid. Jumped to the detected error location.');
            }
        }
    };

    const handlePasteDialogKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            cancelPasteModal();
            return;
        }

        if (e.altKey && (e.key === 'j' || e.key === 'J')) {
            if (pasteJsonStatus === 'invalid') {
                e.preventDefault();
                jumpToPasteJsonError();
            }
            return;
        }

        if (e.key !== 'Tab') {
            return;
        }

        const focusables = [
            pasteTextareaRef.current,
            pasteClipboardButtonRef.current,
            pasteCancelButtonRef.current,
            pasteParseButtonRef.current,
            keepEditingButtonRef.current,
            discardPasteButtonRef.current
        ].filter((el): el is HTMLTextAreaElement | HTMLButtonElement => !!el && !el.hasAttribute('disabled'));

        if (focusables.length === 0) {
            return;
        }

        const activeElement = document.activeElement;
        const currentIndex = activeElement ? focusables.indexOf(activeElement as HTMLTextAreaElement | HTMLButtonElement) : -1;
        const nextIndex = e.shiftKey
            ? (currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1)
            : (currentIndex >= focusables.length - 1 ? 0 : currentIndex + 1);

        e.preventDefault();
        const nextElement = focusables[nextIndex];
        if (nextElement) {
            nextElement.focus();
        }
    };

    const pasteCharCount = pasteJsonValue.length;
    const pasteLineCount = pasteJsonValue.trim().length > 0 ? pasteJsonValue.split(/\r?\n/).length : 0;
    const isLargePastePayload = pasteCharCount > 20000;
    const pasteJsonStatus: 'empty' | 'valid' | 'invalid' = (() => {
        if (!pasteJsonValue.trim()) {
            return 'empty';
        }
        try {
            JSON.parse(pasteJsonValue);
            return 'valid';
        } catch {
            return 'invalid';
        }
    })();
    const pasteJsonErrorLocation: JsonErrorLocation | null = (() => {
        if (pasteJsonStatus !== 'invalid') {
            return null;
        }
        try {
            JSON.parse(pasteJsonValue);
            return null;
        } catch (error) {
            return getJsonErrorLocation(pasteJsonValue, error);
        }
    })();

    const jumpToPasteJsonError = () => {
        const textarea = pasteTextareaRef.current;
        if (!textarea || !pasteJsonErrorLocation) {
            return;
        }

        const lines = pasteJsonValue.split(/\r?\n/);
        const targetLineIndex = Math.max(0, Math.min(pasteJsonErrorLocation.line - 1, lines.length - 1));
        const linePrefixLength = lines.slice(0, targetLineIndex).reduce((sum, line) => sum + line.length + 1, 0);
        const currentLineLength = (lines[targetLineIndex] || '').length;
        const targetColumnIndex = Math.max(0, Math.min(pasteJsonErrorLocation.column - 1, currentLineLength));
        const targetIndex = linePrefixLength + targetColumnIndex;

        textarea.focus();
        textarea.setSelectionRange(targetIndex, targetIndex);

        const computedStyles = window.getComputedStyle(textarea);
        const parsedLineHeight = Number.parseFloat(computedStyles.lineHeight);
        const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : 18;
        const targetTop = targetLineIndex * lineHeight;
        const centeredTop = Math.max(0, targetTop - (textarea.clientHeight / 2) + lineHeight);
        textarea.scrollTop = centeredTop;

        setPasteErrorPulse(true);
        if (pasteErrorPulseTimeoutRef.current) {
            clearTimeout(pasteErrorPulseTimeoutRef.current);
        }
        pasteErrorPulseTimeoutRef.current = setTimeout(() => {
            setPasteErrorPulse(false);
            pasteErrorPulseTimeoutRef.current = null;
        }, 650);
    };

    return (
        <div className="mb-8 bg-slate-900/50 border border-white/10 rounded-[2rem] p-5 md:p-6">
            {/* Header with export/import in top-right */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${accentClassName}`}>
                        <Server className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-white text-xs font-black uppercase tracking-widest">Server Profiles</h3>
                        <p className="text-[11px] text-slate-500">Each app keeps its own saved server list. New profiles start blank.</p>
                    </div>
                </div>

                <div className="flex gap-2 shrink-0">
                    {expectedAppId && (
                        <button
                            type="button"
                            onClick={copySampleImportJson}
                            title="Copy sample JSON profile"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            <Copy className="w-3 h-3" /> <span className="hidden sm:inline">Copy</span>
                        </button>
                    )}
                    {onImportProfile && (
                        <button
                            ref={pasteButtonRef}
                            type="button"
                            onClick={openPasteModal}
                            title="Paste JSON profile"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            <Plus className="w-3 h-3" /> <span className="hidden sm:inline">Paste</span>
                        </button>
                    )}
                    {expectedAppId && (
                        <button
                            type="button"
                            onClick={downloadSampleImportFile}
                            title="Download sample JSON profile"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            <Download className="w-3 h-3" /> <span className="hidden sm:inline">Sample</span>
                        </button>
                    )}
                    {onImportProfile && (
                        <>
                            <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileChange} className="hidden" />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                title="Import profile from JSON file"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <Upload className="w-3 h-3" /> <span className="hidden sm:inline">Import</span>
                            </button>
                        </>
                    )}
                    {onExportProfile && (
                        <button
                            type="button"
                            onClick={onExportProfile}
                            title="Export active profile to JSON file"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            <Download className="w-3 h-3" /> <span className="hidden sm:inline">Export</span>
                        </button>
                    )}
                </div>
            </div>

            {importNotice && (
                <div
                    className={`mb-4 rounded-xl border px-3 py-2 text-xs font-semibold ${
                        importNotice.type === 'success'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                            : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                    }`}
                >
                    {importNotice.text}
                </div>
            )}

            {pendingImport && (
                <div className={`mb-4 rounded-xl border px-3 py-3 text-xs ${pendingImport.mismatch ? 'border-amber-500/30 bg-amber-500/10' : 'border-sky-500/30 bg-sky-500/10'}`}>
                    <p className={`font-black uppercase tracking-widest text-[10px] ${pendingImport.mismatch ? 'text-amber-300' : 'text-sky-300'}`}>
                        Ready To Import
                    </p>
                    <p className="text-slate-200 mt-1">
                        File: <span className="font-bold">{pendingImport.fileName}</span> | Profile: <span className="font-bold">{pendingImport.profileName}</span>
                    </p>
                    {pendingImport.appId && (
                        <p className={`mt-1 ${pendingImport.mismatch ? 'text-amber-200' : 'text-slate-300'}`}>
                            App tag in file: <span className="font-bold">{pendingImport.appId}</span>
                            {expectedAppId ? ` | Current app: ${expectedAppId}` : ''}
                        </p>
                    )}
                    <p className="mt-1 text-slate-300">
                        Imported fields: <span className="font-bold">{pendingImport.keyCount}</span>
                        {pendingImport.keyPreview.length > 0 ? ` | Sample: ${pendingImport.keyPreview.join(', ')}` : ''}
                    </p>
                    {pendingImport.compatibilityScore !== null && (
                        <p className={`mt-1 ${pendingImport.compatibilityScore >= 60 ? 'text-emerald-200' : pendingImport.compatibilityScore >= 30 ? 'text-amber-200' : 'text-rose-200'}`}>
                            Compatibility score: <span className="font-bold">{pendingImport.compatibilityScore}%</span>
                            {` (${pendingImport.matchedKeyCount}/${pendingImport.expectedKeyCount} expected keys matched, ${pendingImport.matchedCriticalKeyCount}/${pendingImport.criticalKeyCount} critical)`}
                            {pendingImport.matchedKeys.length > 0 ? ` | Matched sample: ${pendingImport.matchedKeys.join(', ')}` : ''}
                        </p>
                    )}
                    {pendingImport.mismatch && (
                        <p className="mt-1 text-amber-200 font-semibold">This file appears to target a different app. You can still import it, but some fields may be ignored.</p>
                    )}
                    {pendingImport.compatibilityScore !== null && pendingImport.compatibilityScore < 30 && (
                        <p className="mt-1 text-rose-200 font-semibold">Low compatibility detected for this app. Import may produce mostly defaults.</p>
                    )}
                    {pendingImport.criticalKeyCount > 0 && pendingImport.matchedCriticalKeyCount === 0 && (
                        <div className="mt-2 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2">
                            <p className="text-rose-200 font-semibold">No critical keys matched for this app. Import is likely incompatible.</p>
                            <label className="mt-2 flex items-center gap-2 text-rose-100/90">
                                <input
                                    type="checkbox"
                                    checked={importAcknowledgeCriticalMismatch}
                                    onChange={(e) => setImportAcknowledgeCriticalMismatch(e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-white/30 bg-slate-950"
                                />
                                <span className="text-[11px] font-semibold">I understand this file may not work for the current app.</span>
                            </label>
                        </div>
                    )}
                    {pendingImport.nameConflict && (
                        <p className="mt-1 text-amber-200 font-semibold">A profile with this name already exists. Import will still proceed and create a new profile.</p>
                    )}
                    {pendingImport.keyCount === 0 && (
                        <div className="mt-2 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2">
                            <p className="text-rose-200 font-semibold">No configuration fields detected. Confirm only if this is expected.</p>
                            <label className="mt-2 flex items-center gap-2 text-rose-100/90">
                                <input
                                    type="checkbox"
                                    checked={importAcknowledgeEmpty}
                                    onChange={(e) => setImportAcknowledgeEmpty(e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-white/30 bg-slate-950"
                                />
                                <span className="text-[11px] font-semibold">I understand this import has no detected config fields.</span>
                            </label>
                        </div>
                    )}
                    <div className="mt-3 flex gap-2">
                        <button
                            type="button"
                            onClick={confirmImport}
                            disabled={(pendingImport.keyCount === 0 && !importAcknowledgeEmpty) || (pendingImport.criticalKeyCount > 0 && pendingImport.matchedCriticalKeyCount === 0 && !importAcknowledgeCriticalMismatch)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Confirm Import
                        </button>
                        <button
                            type="button"
                            onClick={cancelImport}
                            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Active profile row: selector + action buttons */}
            <div className="flex gap-2 mb-3">
                {renameMode ? (
                    <div className="flex flex-1 gap-2">
                        <input
                            autoFocus
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') cancelRename(); }}
                            className="flex-1 bg-slate-950 border border-white/20 rounded-2xl py-3 px-4 text-sm font-semibold text-slate-100 focus:outline-none focus:border-white/40"
                        />
                        <button type="button" onClick={commitRename} title="Confirm rename" className="flex items-center justify-center w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-all">
                            <Check className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={cancelRename} title="Cancel" className="flex items-center justify-center w-11 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 transition-all">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : confirmDelete ? (
                    <div className="flex flex-1 items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/5 px-4 py-2">
                        <span className="flex-1 text-xs text-rose-200 font-bold truncate">
                            Remove &ldquo;<span className="text-white">{activeProfile?.name}</span>&rdquo;?
                        </span>
                        <button
                            type="button"
                            onClick={() => { onDeleteProfile(activeProfileId); setConfirmDelete(false); }}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shrink-0"
                        >
                            Remove
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all shrink-0"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <>
                        <select
                            value={activeProfileId}
                            onChange={(e) => { onSelectProfile(e.target.value); setConfirmDelete(false); }}
                            className="flex-1 bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-sm font-semibold text-slate-100 focus:outline-none"
                        >
                            {profiles.map((profile) => (
                                <option key={profile.id} value={profile.id} className="bg-slate-950">
                                    {profile.name}
                                </option>
                            ))}
                        </select>

                        {onRenameProfile && (
                            <button type="button" onClick={startRename} title="Rename profile" className="flex items-center justify-center w-11 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {onDuplicateProfile && (
                            <button type="button" onClick={handleDuplicate} title="Duplicate profile" className="flex items-center justify-center w-11 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => setConfirmDelete(true)}
                            disabled={profiles.length <= 1}
                            title="Remove profile"
                            className="flex items-center justify-center w-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </>
                )}
            </div>

            {/* Add new profile row */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && newProfileName.trim()) {
                            onCreateProfile(newProfileName);
                            setNewProfileName('');
                        }
                    }}
                    placeholder="New profile name…"
                    className="flex-1 bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-sm font-semibold text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-white/20"
                />
                <button
                    type="button"
                    onClick={() => {
                        if (newProfileName.trim()) {
                            onCreateProfile(newProfileName);
                            setNewProfileName('');
                        }
                    }}
                    disabled={!newProfileName.trim()}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus className="w-4 h-4" /> Add
                </button>
            </div>

            {showPasteModal && (
                <div
                    onClick={cancelPasteModal}
                    className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center"
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Paste Import JSON"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={handlePasteDialogKeyDown}
                        className="w-full max-w-2xl bg-slate-950 border border-white/10 rounded-[1.5rem] shadow-[0_32px_64px_-20px_rgba(0,0,0,0.8)] overflow-hidden"
                    >
                        <div className="px-5 py-4 border-b border-white/10 bg-slate-900/60 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-sky-300">Paste Import JSON</p>
                                <p className="text-xs text-slate-400 mt-1">Paste a profile JSON object, then continue to preview and confirm.</p>
                                <p className="text-[10px] text-slate-500 mt-1">Shortcuts: Ctrl+Enter parse/jump, Ctrl+Shift+F format, Alt+J jump, Esc cancel.</p>
                                {pasteJsonValue.trim().length > 0 && (
                                    <span className="inline-flex mt-2 px-2 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-[10px] font-black uppercase tracking-wider text-amber-200">
                                        Unsaved Paste
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={cancelPasteModal}
                                title="Close"
                                className="shrink-0 h-8 w-8 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5">
                            <textarea
                                ref={pasteTextareaRef}
                                value={pasteJsonValue}
                                onChange={(e) => setPasteJsonValue(e.target.value)}
                                onKeyDown={handlePasteModalKeyDown}
                                placeholder='{"profileName":"My Server","app":"media","config":{"serverHost":"..."}}'
                                className={`w-full min-h-[220px] bg-slate-950 border rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all duration-300 ${
                                    pasteErrorPulse
                                        ? 'border-rose-400 ring-2 ring-rose-400/30'
                                        : 'border-white/15 focus:border-white/30'
                                }`}
                            />
                            <div className="mt-2 flex items-center justify-between gap-3 text-[10px]">
                                <p className="text-slate-500">
                                    {pasteLineCount} lines | {pasteCharCount} chars
                                </p>
                                <span
                                    className={`px-2 py-1 rounded-md border font-black uppercase tracking-wider ${
                                        pasteJsonStatus === 'valid'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                                            : pasteJsonStatus === 'invalid'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                                                : 'border-white/15 bg-white/5 text-slate-400'
                                    }`}
                                >
                                    {pasteJsonStatus === 'valid' ? 'JSON Valid' : pasteJsonStatus === 'invalid' ? 'JSON Invalid' : 'JSON Empty'}
                                </span>
                                {pasteJsonStatus === 'invalid' && pasteJsonErrorLocation && (
                                    <button
                                        type="button"
                                        onClick={jumpToPasteJsonError}
                                        className="px-2 py-1 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-200 font-semibold hover:bg-rose-500/20"
                                    >
                                        Jump to line {pasteJsonErrorLocation.line}, col {pasteJsonErrorLocation.column}
                                    </button>
                                )}
                                {isLargePastePayload && (
                                    <p className="text-amber-300 font-semibold">Large payload detected. Parsing may take longer.</p>
                                )}
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-white/10 bg-slate-900/40 flex items-center justify-end gap-2">
                            {showDiscardPastePrompt ? (
                                <>
                                    <p className="mr-auto text-xs text-rose-200 font-semibold">Discard pasted JSON content?</p>
                                    <button
                                        ref={keepEditingButtonRef}
                                        type="button"
                                        onClick={keepEditingPaste}
                                        className="px-4 h-10 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-black uppercase tracking-widest"
                                    >
                                        Keep Editing
                                    </button>
                                    <button
                                        ref={discardPasteButtonRef}
                                        type="button"
                                        onClick={discardPasteAndClose}
                                        className="px-4 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black uppercase tracking-widest"
                                    >
                                        Discard
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        ref={pasteClipboardButtonRef}
                                        type="button"
                                        onClick={pasteFromClipboard}
                                        disabled={isReadingClipboard}
                                        className="px-4 h-10 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {isReadingClipboard ? 'Reading...' : 'Paste Clipboard'}
                                    </button>
                                    <button
                                        ref={pasteCancelButtonRef}
                                        type="button"
                                        onClick={cancelPasteModal}
                                        className="px-4 h-10 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-black uppercase tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={formatPasteJson}
                                        disabled={!pasteJsonValue.trim()}
                                        className="px-4 h-10 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Format JSON
                                    </button>
                                    <button
                                        ref={pasteParseButtonRef}
                                        type="button"
                                        onClick={handlePasteImport}
                                        disabled={pasteJsonStatus !== 'valid'}
                                        className="px-4 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Parse JSON
                                    </button>
                                    {pasteJsonStatus !== 'valid' && (
                                        <span className={`text-[10px] font-semibold ${pasteJsonStatus === 'empty' ? 'text-slate-500' : 'text-rose-300'}`}>
                                            {pasteJsonStatus === 'empty' ? 'Paste JSON to enable parse' : 'Fix invalid JSON to enable parse'}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}