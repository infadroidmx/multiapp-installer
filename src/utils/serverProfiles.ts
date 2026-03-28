export interface ServerProfile<T = any> {
    id: string;
    name: string;
    config: T;
}

export interface ServerProfileStore<T = any> {
    version: number;
    activeServerProfileId: string;
    serverProfiles: Array<ServerProfile<T>>;
}

function createServerProfileId() {
    return `srv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneConfig<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

export function createServerProfileStore<T>(rawData: any, createDefaultConfig: () => T, importedName = 'Server 1'): ServerProfileStore<T> {
    if (rawData && Array.isArray(rawData.serverProfiles) && rawData.serverProfiles.length > 0) {
        const profiles = rawData.serverProfiles.map((profile: any, index: number) => ({
            id: profile?.id || createServerProfileId(),
            name: profile?.name || `Server ${index + 1}`,
            config: profile?.config || createDefaultConfig()
        }));

        return {
            version: 2,
            activeServerProfileId: rawData.activeServerProfileId || profiles[0].id,
            serverProfiles: profiles
        };
    }

    const hasLegacyFlatConfig = rawData && typeof rawData === 'object' && Object.keys(rawData).length > 0;
    const initialProfile = {
        id: createServerProfileId(),
        name: importedName,
        config: hasLegacyFlatConfig ? rawData : createDefaultConfig()
    };

    return {
        version: 2,
        activeServerProfileId: initialProfile.id,
        serverProfiles: [initialProfile]
    };
}

export function getActiveServerProfile<T>(store: ServerProfileStore<T>): ServerProfile<T> {
    return store.serverProfiles.find((profile) => profile.id === store.activeServerProfileId) || store.serverProfiles[0];
}

export function updateActiveServerProfile<T>(store: ServerProfileStore<T>, config: T): ServerProfileStore<T> {
    return {
        ...store,
        serverProfiles: store.serverProfiles.map((profile) =>
            profile.id === store.activeServerProfileId
                ? { ...profile, config }
                : profile
        )
    };
}

export function addServerProfile<T>(store: ServerProfileStore<T>, name: string, createDefaultConfig: () => T): ServerProfileStore<T> {
    const newProfile = {
        id: createServerProfileId(),
        name: name.trim() || `Server ${store.serverProfiles.length + 1}`,
        config: cloneConfig(createDefaultConfig())
    };

    return {
        ...store,
        activeServerProfileId: newProfile.id,
        serverProfiles: [...store.serverProfiles, newProfile]
    };
}

export function removeServerProfile<T>(store: ServerProfileStore<T>, profileId: string): ServerProfileStore<T> {
    if (store.serverProfiles.length <= 1) {
        return store;
    }

    const remainingProfiles = store.serverProfiles.filter((profile) => profile.id !== profileId);
    const nextActiveId = store.activeServerProfileId === profileId
        ? remainingProfiles[0].id
        : store.activeServerProfileId;

    return {
        ...store,
        activeServerProfileId: nextActiveId,
        serverProfiles: remainingProfiles
    };
}

export function selectServerProfile<T>(store: ServerProfileStore<T>, profileId: string): ServerProfileStore<T> {
    return {
        ...store,
        activeServerProfileId: profileId
    };
}

export function renameServerProfile<T>(store: ServerProfileStore<T>, profileId: string, newName: string): ServerProfileStore<T> {
    const trimmed = newName.trim();
    if (!trimmed) return store;
    return {
        ...store,
        serverProfiles: store.serverProfiles.map((profile) =>
            profile.id === profileId ? { ...profile, name: trimmed } : profile
        )
    };
}

export function duplicateServerProfile<T>(store: ServerProfileStore<T>, profileId: string, newName: string): ServerProfileStore<T> {
    const source = store.serverProfiles.find((p) => p.id === profileId);
    if (!source) return store;
    const copy = {
        id: createServerProfileId(),
        name: newName.trim() || `${source.name} (copy)`,
        config: cloneConfig(source.config)
    };
    return {
        ...store,
        activeServerProfileId: copy.id,
        serverProfiles: [...store.serverProfiles, copy]
    };
}