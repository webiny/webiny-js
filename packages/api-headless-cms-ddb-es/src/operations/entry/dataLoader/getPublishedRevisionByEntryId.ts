import DataLoader from "dataloader";
import { batchReadAll } from "@webiny/db-dynamodb";
import { cleanupItems } from "@webiny/db-dynamodb/utils/cleanup.js";
import type { CmsStorageEntry } from "@webiny/api-headless-cms/types/index.js";
import { createPartitionKey, createPublishedSortKey } from "~/operations/entry/keys.js";
import type { DataLoaderParams } from "./types.js";
import { createBatchScheduleFn } from "./createBatchScheduleFn.js";

export const createGetPublishedRevisionByEntryId = (params: DataLoaderParams) => {
    const { entity, tenant } = params;

    const publishedKey = createPublishedSortKey();
    return new DataLoader<string, CmsStorageEntry[]>(
        async (ids: readonly string[]) => {
            const queries = ids.reduce<Record<string, ReturnType<typeof entity.getBatch>>>(
                (collection, id) => {
                    const partitionKey = createPartitionKey({
                        tenant,
                        id
                    });
                    if (collection[partitionKey]) {
                        return collection;
                    }
                    collection[partitionKey] = entity.getBatch({
                        PK: partitionKey,
                        SK: publishedKey
                    });
                    return collection;
                },
                {}
            );

            const records = await batchReadAll<CmsStorageEntry>({
                table: entity.table,
                items: Object.values(queries)
            });
            const items = cleanupItems(entity, records);

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
