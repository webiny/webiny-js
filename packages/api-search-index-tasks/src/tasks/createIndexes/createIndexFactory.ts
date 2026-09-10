import type { IIndexManager } from "~/abstractions/IndexManager.js";
import type { GenericRecord } from "@webiny/api/types.js";

export const createIndexFactory = (manager: IIndexManager) => {
    return {
        create: async (index: string, settings?: GenericRecord): Promise<void> => {
            return manager.createIndex(index, settings);
        },
        createIfNotExists: async (index: string, settings?: GenericRecord): Promise<void> => {
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
