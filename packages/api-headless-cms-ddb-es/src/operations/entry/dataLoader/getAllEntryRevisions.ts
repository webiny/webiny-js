import DataLoader from "dataloader";
import type { CmsStorageEntry } from "@webiny/api-headless-cms/types/index.js";
import { createPartitionKey } from "~/operations/entry/keys.js";
import type { IDataLoaderParams } from "./types.js";
import { createBatchScheduleFn } from "./createBatchScheduleFn.js";

export const createGetAllEntryRevisions = (params: IDataLoaderParams) => {
    const { entity, tenant, modelId } = params;
    return new DataLoader<string, CmsStorageEntry[]>(
        async ids => {
            const results: Record<string, CmsStorageEntry[]> = {};

            for (const id of ids) {
                results[id] = (
                    await entity.queryAllClean({
                        partitionKey: createPartitionKey({
                            tenant,
                            id
                        }),
                        options: {
                            beginsWith: "REV#"
                        }
                    })
                ).map(item => {
                    return item.data;
                });
            }

            return ids.map(entryId => {
                return (results[entryId] || []).filter(item => {
                    return item.modelId === modelId;
                });
            });
        },
        {
            batchScheduleFn: createBatchScheduleFn()
        }
    );
};
