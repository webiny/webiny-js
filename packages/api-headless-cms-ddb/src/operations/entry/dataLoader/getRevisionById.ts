import DataLoader from "dataloader";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { CmsStorageEntry } from "@webiny/api-headless-cms/types";
import { cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { createPartitionKey, createRevisionSortKey } from "~/operations/entry/keys";
import { DataLoaderParams } from "./types";
import { parseIdentifier } from "@webiny/utils";
import { createBatchScheduleFn } from "./createBatchScheduleFn";

export const createGetRevisionById = (params: DataLoaderParams) => {
    const { entity, locale, tenant } = params;

    return new DataLoader<string, CmsStorageEntry[]>(
        async (ids: readonly string[]) => {
            const queries = ids.reduce((collection, id) => {
                const partitionKey = createPartitionKey({
                    tenant,
                    locale,
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
                /**
                 * We cast as any because there is no return type defined.
                 */
            }, {} as Record<string, any>);

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
