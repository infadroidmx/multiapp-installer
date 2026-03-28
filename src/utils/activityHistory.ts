export type ActivityStatus = 'success' | 'error' | 'info';

export interface ActivityItem {
    id: string;
    appId: 'postiz' | 'xui' | 'media';
    profileId: string;
    profileName: string;
    action: string;
    status: ActivityStatus;
    message: string;
    timestamp: number;
}

interface ActivityStore {
    version: number;
    items: ActivityItem[];
}

interface RecordActivityInput {
    appId: 'postiz' | 'xui' | 'media';
    profileId: string;
    profileName: string;
    action: string;
    status: ActivityStatus;
    message: string;
}

const STORAGE_KEY = 'multiapp:activity-history:v1';
const MAX_ITEMS = 300;

function createId() {
    return `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadStore(): ActivityStore {
    if (typeof window === 'undefined' || !window.localStorage) {
        return { version: 1, items: [] };
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return { version: 1, items: [] };
        }
        const parsed = JSON.parse(raw) as ActivityStore;
        if (!parsed || !Array.isArray(parsed.items)) {
            return { version: 1, items: [] };
        }
        return {
            version: 1,
            items: parsed.items.filter(Boolean)
        };
    } catch {
        return { version: 1, items: [] };
    }
}

function saveStore(store: ActivityStore) {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function recordActivity(input: RecordActivityInput) {
    const store = loadStore();
    const nextItem: ActivityItem = {
        id: createId(),
        timestamp: Date.now(),
        ...input
    };

    const items = [nextItem, ...store.items].slice(0, MAX_ITEMS);
    saveStore({ version: 1, items });
    return nextItem;
}

export function getProfileActivityHistory(appId: 'postiz' | 'xui' | 'media', profileId: string, limit = 12): ActivityItem[] {
    if (!profileId) {
        return [];
    }

    const store = loadStore();
    return store.items
        .filter((item) => item.appId === appId && item.profileId === profileId)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
}

export function clearProfileHistory(appId: 'postiz' | 'xui' | 'media', profileId: string) {
    const store = loadStore();
    const filtered = store.items.filter(
        (item) => !(item.appId === appId && item.profileId === profileId)
    );
    saveStore({ ...store, items: filtered });
}
