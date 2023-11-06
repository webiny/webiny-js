import DataLoader from "dataloader";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { CmsStorageEntry } from "@webiny/api-headless-cms/types";
import { createBatchScheduleFn } from "./createBatchScheduleFn";
import { createLatestSortKey, createPartitionKey } from "~/operations/entry/keys";
import { DataLoaderParams } from "./types";

export const createGetLatestRevisionByEntryId = (params: DataLoaderParams) => {
    const { entity, locale, tenant } = params;

    const latestKey = createLatestSortKey();

    return new DataLoader<string, CmsStorageEntry[]>(
        async (ids: readonly string[]) => {
            const queries = ids.reduce<Record<string, ReturnType<typeof entity.getBatch>>>(
                (collection, id) => {
                    const partitionKey = createPartitionKey({
                        tenant,
                        locale,
                        id
                    });
                    if (collection[partitionKey]) {
                        return collection;
                    }
                    collection[partitionKey] = entity.getBatch({
                        PK: partitionKey,
                        SK: latestKey
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
