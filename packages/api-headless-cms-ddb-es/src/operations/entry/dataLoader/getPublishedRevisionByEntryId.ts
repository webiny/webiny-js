import DataLoader from "dataloader";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { CmsStorageEntry } from "@webiny/api-headless-cms/types";
import { createPartitionKey, createPublishedSortKey } from "~/operations/entry/keys";
import { DataLoaderParams } from "./types";
import { createBatchScheduleFn } from "./createBatchScheduleFn";

export const createGetPublishedRevisionByEntryId = (params: DataLoaderParams) => {
    const { entity, locale, tenant } = params;

    const publishedKey = createPublishedSortKey();
    return new DataLoader<string, CmsStorageEntry[]>(
        async (ids: readonly string[]) => {
            const queries = ids.reduce((collection, id) => {
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
                    SK: publishedKey
                });
                return collection;
                /**
                 * We cast as any because there is no return type defined.
                 */
            }, {} as Record<string, any>);

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
