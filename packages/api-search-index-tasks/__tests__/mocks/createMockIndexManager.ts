import type {
    IIndexManager,
    IIndexSettings,
    IIndexSettingsMap
} from "~/abstractions/IndexManager.js";

export interface IMockIndexManagerOptions {
    existingIndexes?: string[];
}

export const createMockIndexManager = (options: IMockIndexManagerOptions = {}) => {
    const existing = new Set(options.existingIndexes || []);
    const disabled = new Set<string>();
    const created: Array<{ index: string; settings?: Record<string, any> }> = [];
    const settingsMap: IIndexSettingsMap = {};

    const manager: IIndexManager = {
        get settings() {
            return settingsMap;
        },
        list: async () => Array.from(existing),
        indexExists: async (index: string) => existing.has(index),
        createIndex: async (index: string, settings?: Record<string, any>) => {
            existing.add(index);
            created.push({ index, settings });
        },
        disableIndexing: async (index: string): Promise<IIndexSettings> => {
            if (settingsMap[index]) {
                return settingsMap[index];
            }
            const settings: IIndexSettings = { numberOfReplicas: 1, refreshInterval: "1s" };
            settingsMap[index] = settings;
            disabled.add(index);
            return settings;
        },
        enableIndexing: async (index?: string) => {
            if (!index) {
                for (const idx of Object.keys(settingsMap)) {
                    disabled.delete(idx);
                }
                return;
            }
            disabled.delete(index);
        }
    };

    return { manager, existing, disabled, created, settingsMap };
};
