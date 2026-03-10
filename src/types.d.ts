interface ElectronAPI {
    saveConfig: (data: any) => Promise<any>;
    loadConfig: () => Promise<any>;
    deployServer: (config: any, mode: string) => Promise<any>;
    fetchLogs: (config: any) => Promise<any>;
    createUser: (config: any, name: string, email: string, password: string) => Promise<any>;
    onLogMessage: (callback: (msg: string) => void) => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

export { };
