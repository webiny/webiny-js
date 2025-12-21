import DataLoader from "dataloader";
import type { CmsStorageEntry } from "@webiny/api-headless-cms/types/index.js";
import type { QueryAllParams } from "@webiny/db-dynamodb/utils/query.js";
import { queryAll } from "@webiny/db-dynamodb/utils/query.js";
import { createPartitionKey } from "~/operations/entry/keys.js";
import { cleanupItems } from "@webiny/db-dynamodb/utils/cleanup.js";
import type { DataLoaderParams } from "./types.js";
import { createBatchScheduleFn } from "./createBatchScheduleFn.js";

export const createGetAllEntryRevisions = (params: DataLoaderParams) => {
    const { entity, tenant } = params;
    return new DataLoader<string, CmsStorageEntry[]>(
        async (ids: readonly string[]) => {
            const results: Record<string, CmsStorageEntry[]> = {};
            for (const id of ids) {
                const queryAllParams: QueryAllParams = {
                    entity,
                    partitionKey: createPartitionKey({
                        tenant,
                        id
                    }),
                    options: {
                        beginsWith: "REV#"
                    }
                };
                const items = await queryAll<CmsStorageEntry>(queryAllParams);
                results[id] = cleanupItems(entity, items);
            }

            return ids.map(id => {
                return results[id] || [];
            });
        },
        {
            batchScheduleFn: createBatchScheduleFn()
        }
    );
};
