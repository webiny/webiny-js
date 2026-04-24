import DataLoader from "dataloader";
import type { CmsStorageEntry } from "@webiny/api-headless-cms/types/index.js";
import { createBatchScheduleFn } from "./createBatchScheduleFn.js";
import { createLatestSortKey, createPartitionKey } from "~/operations/entry/keys.js";
import type { IDataLoaderParams } from "./types.js";

export const createGetLatestRevisionByEntryId = (params: IDataLoaderParams) => {
    const { entity, tenant, modelId } = params;

    const latestKey = createLatestSortKey();

    return new DataLoader<string, CmsStorageEntry[]>(
        async ids => {
            const reader = entity.createEntityReader();

            const keys = new Set<string>();

            for (const id of ids) {
                const partitionKey = createPartitionKey({
                    tenant,
                    id
                });
                if (keys.has(partitionKey)) {
                    continue;
                }
                keys.add(partitionKey);
                reader.get({
                    PK: partitionKey,
                    SK: latestKey
                });
            }

            const items = (await reader.execute()).map(item => {
                return item.data;
            });

            return ids.map(entryId => {
                return items.filter(item => {
                    if (item.modelId !== modelId) {
                        return false;
                    }
                    return entryId === item.entryId;
                });
            });
        },
        {
            batchScheduleFn: createBatchScheduleFn()
        }
    );
};
