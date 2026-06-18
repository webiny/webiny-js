import type { IIndexManager } from "~/settings/types.js";

export const createIndexFactory = (manager: IIndexManager) => {
    return {
        create: async (index: string, settings?: Record<string, any>): Promise<void> => {
            return manager.createIndex(index, settings);
        },
        createIfNotExists: async (index: string, settings?: Record<string, any>): Promise<void> => {
            try {
                const exists = await manager.indexExists(index);
                if (exists) {
                    return;
                }
            } catch {
                return;
            }

            return await manager.createIndex(index, settings);
        }
    };
};
