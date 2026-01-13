import DataLoader from "dataloader";
import type { CmsStorageEntry } from "@webiny/api-headless-cms/types/index.js";
import { createPartitionKey, createPublishedSortKey } from "~/operations/entry/keys.js";
import type { IDataLoaderParams } from "./types.js";
import { createBatchScheduleFn } from "./createBatchScheduleFn.js";

export const createGetPublishedRevisionByEntryId = (params: IDataLoaderParams) => {
    const { entity, tenant } = params;

    const publishedKey = createPublishedSortKey();
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
                    SK: publishedKey
                });
            }

            const items = (await reader.execute()).map(item => {
                return item.data;
            });

            return ids.map(entryId => {
                return items.filter(item => {
                    return entryId === item.entryId;
                });
            });
        },
        {
            batchScheduleFn: createBatchScheduleFn()
        }
    );
};
