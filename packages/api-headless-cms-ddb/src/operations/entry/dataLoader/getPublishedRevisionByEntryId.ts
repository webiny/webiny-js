import DataLoader from "dataloader";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { CmsStorageEntry } from "@webiny/api-headless-cms/types";
import { createPartitionKey, createPublishedSortKey } from "~/operations/entry/keys";
import { DataLoaderParams } from "./types";
import { parseIdentifier } from "@webiny/utils";
import { createBatchScheduleFn } from "./createBatchScheduleFn";

export const createGetPublishedRevisionByEntryId = (params: DataLoaderParams) => {
    const { entity, locale, tenant } = params;

    const publishedKey = createPublishedSortKey();
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

            return ids.map(id => {
                const { id: entryId } = parseIdentifier(id);
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
