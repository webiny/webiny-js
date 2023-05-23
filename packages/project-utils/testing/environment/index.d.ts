export type Plugin<T = Record<string, any>> = {
    type: string;
    name?: string;
    init?: () => void;
    [key: string]: any;
} & T;

export type PluginCollection = (Plugin | PluginCollection)[];

interface StorageOperations<T = any> {
    storageOperations: T;
    plugins: PluginCollection;
}

export function setStorageOps(app: string, factory: () => StorageOperations): void;
export function getStorageOps<T>(app: string): StorageOperations<T>;
