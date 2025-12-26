import DataLoader from "dataloader";
import { batchReadAll } from "@webiny/db-dynamodb";
import type { CmsStorageEntry } from "@webiny/api-headless-cms/types/index.js";
import { cleanupItems } from "@webiny/db-dynamodb/utils/cleanup.js";
import { createPartitionKey, createRevisionSortKey } from "~/operations/entry/keys.js";
import type { DataLoaderParams } from "./types.js";
import { parseIdentifier } from "@webiny/utils";
import { createBatchScheduleFn } from "./createBatchScheduleFn.js";

export const createGetRevisionById = (params: DataLoaderParams) => {
    const { entity, tenant } = params;

    return new DataLoader<string, CmsStorageEntry[]>(
        async (ids: readonly string[]) => {
            const queries = ids.reduce<Record<string, ReturnType<typeof entity.getBatch>>>(
                (collection, id) => {
                    const partitionKey = createPartitionKey({
                        tenant,
                        id
                    });
                    const { version } = parseIdentifier(id);
                    if (version === null) {
                        return collection;
                    }
                    const sortKey = createRevisionSortKey({
                        version
                    });
                    const keys = `${partitionKey}__${sortKey}`;
                    if (collection[keys]) {
                        return collection;
                    }

                    collection[keys] = entity.getBatch({
                        PK: partitionKey,
                        SK: sortKey
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
                return items.filter(item => {
                    return id === item.id;
                });
            });
        },
        {
            batchScheduleFn: createBatchScheduleFn()
        }
    );
};
