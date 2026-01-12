import DataLoader from "dataloader";
import { cleanupItems } from "@webiny/db-dynamodb/utils/cleanup.js";
import type { CmsStorageEntry } from "@webiny/api-headless-cms/types/index.js";
import { createBatchScheduleFn } from "./createBatchScheduleFn.js";
import { createLatestSortKey, createPartitionKey } from "~/operations/entry/keys.js";
import type { IDataLoaderParams } from "./types.js";
import { parseIdentifier } from "@webiny/utils";

export const createGetLatestRevisionByEntryId = (params: IDataLoaderParams) => {
    const { entity, tenant } = params;

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

            const records = await reader.execute();
            const items = cleanupItems(entity.entity, records).map(item => {
                return item.data;
            });

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
