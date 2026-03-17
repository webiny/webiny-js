import DataLoader from "dataloader";
import type { CmsStorageEntry } from "@webiny/api-headless-cms/types/index.js";
import { createPartitionKey, createRevisionSortKey } from "~/operations/entry/keys.js";
import type { IDataLoaderParams } from "./types.js";
import { parseIdentifier } from "@webiny/utils";
import { createBatchScheduleFn } from "./createBatchScheduleFn.js";

export const createGetRevisionById = (params: IDataLoaderParams) => {
    const { entity, tenant, modelId } = params;

    return new DataLoader<string, CmsStorageEntry[]>(
        async ids => {
            const reader = entity.createEntityReader();

            const keys = new Set<string>();

            for (const id of ids) {
                const partitionKey = createPartitionKey({
                    tenant,
                    id
                });
                const { version } = parseIdentifier(id);
                if (version === null) {
                    continue;
                }
                const sortKey = createRevisionSortKey({
                    version
                });
                const key = `${partitionKey}__${sortKey}`;
                if (keys.has(key)) {
                    continue;
                }
                keys.add(key);

                reader.get({
                    PK: partitionKey,
                    SK: sortKey
                });
            }

            const items = (await reader.execute()).map(item => {
                return item.data;
            });

            return ids.map(id => {
                return items.filter(item => {
                    if (item.modelId !== modelId) {
                        return false;
                    }
                    return id === item.id;
                });
            });
        },
        {
            batchScheduleFn: createBatchScheduleFn()
        }
    );
};
