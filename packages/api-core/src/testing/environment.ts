export type Plugin<T = Record<string, any>> = {
    type: string;
    name?: string;
    init?: () => void;
    [key: string]: any;
} & T;

export type PluginCollection = (Plugin | PluginCollection)[];

export interface StorageOperations<T = any> {
    storageOperations: T;
    plugins: PluginCollection;
}

export const getStorageOps = <T = any>(app: string): StorageOperations<T> => {
    const storageOps = (globalThis as Record<string, any>)["__storageOps"];

    if (typeof storageOps === "undefined") {
        throw new Error(`Storage ops are not configured!`);
    }

    const appStorageOps = storageOps[app];
    if (typeof appStorageOps === "undefined") {
        throw new Error(
            `Storage ops for "${app}" are not configured! Have you configured "jest.setup.js" correctly?`
        );
    }

    return appStorageOps();
};

export const setStorageOps = (app: string, factory: () => StorageOperations): void => {
    const storageOps = (globalThis as Record<string, any>)["__storageOps"] || {};
    storageOps[app] = factory;
    (globalThis as Record<string, any>)["__storageOps"] = storageOps;
};

export const clearStorageOps = (): void => {
    delete (globalThis as Record<string, any>)["__storageOps"];
};
