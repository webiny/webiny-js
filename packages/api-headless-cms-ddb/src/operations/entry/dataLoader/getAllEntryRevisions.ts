import DataLoader from "dataloader";
import { CmsStorageEntry } from "@webiny/api-headless-cms/types";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { createPartitionKey } from "~/operations/entry/keys";
import { cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { DataLoaderParams } from "./types";
import { createBatchScheduleFn } from "./createBatchScheduleFn";

export const createGetAllEntryRevisions = (params: DataLoaderParams) => {
    const { entity, locale, tenant } = params;
    return new DataLoader<string, CmsStorageEntry[]>(
        async (ids: readonly string[]) => {
            const results: Record<string, CmsStorageEntry[]> = {};
            for (const id of ids) {
                const queryAllParams: QueryAllParams = {
                    entity,
                    partitionKey: createPartitionKey({
                        tenant,
                        locale,
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
