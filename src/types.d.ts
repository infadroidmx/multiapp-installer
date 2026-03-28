interface ElectronAPI {
    saveConfig: (data: any) => Promise<any>;
    loadConfig: () => Promise<any>;
    saveAppConfig: (appId: 'postiz' | 'xui' | 'media', data: any) => Promise<any>;
    loadAppConfig: (appId: 'postiz' | 'xui' | 'media') => Promise<any>;
    deployServer: (config: any, mode: string) => Promise<any>;
    testServerConnection: (config: any, options?: any) => Promise<any>;
    scanPostizServer: (config: any) => Promise<any>;
    deployMedia: (config: any, mode?: string) => Promise<any>;
    scanMediaServer: (config: any) => Promise<any>;
    deployXui: (config: any, mode?: string) => Promise<any>;
    scanXuiServer: (config: any) => Promise<any>;
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
