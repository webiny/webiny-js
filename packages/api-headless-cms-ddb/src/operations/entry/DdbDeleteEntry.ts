import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryStorageOperationsDeleteParams
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { DeleteEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteEntryStorageOperation.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { createPartitionKey } from "~/operations/entry/keys.js";

class DdbDeleteEntryImpl implements DeleteEntryStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEntryEntity.Interface,
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute(initialModel: CmsModel, params: CmsEntryStorageOperationsDeleteParams) {
        const { entry } = params;
        const id = entry.id || entry.entryId;
        const model = this.storageModelProvider.getModel(initialModel);

        const partitionKey = createPartitionKey({
            id,
            tenant: model.tenant
        });

        let records: Awaited<ReturnType<typeof this.entity.queryAll>> = [];
        try {
            records = await this.entity.queryAll({
                partitionKey,
                options: {
                    gte: " "
                }
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load all records.",
                ex.code || "LOAD_ALL_RECORDS_ERROR",
                {
                    error: ex,
                    id
                }
            );
        }

        const entityBatch = this.entity.createEntityWriter({
            delete: records.map(item => {
                return {
                    PK: item.PK,
                    SK: item.SK
                };
            })
        });

        try {
            await entityBatch.execute();
            this.dataLoaders.clearAll({
                tenant: entry.tenant
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete the entry.",
                ex.code || "DELETE_ENTRY_ERROR",
                {
                    error: ex,
                    partitionKey,
                    id
                }
            );
        }
    }
}

export const DdbDeleteEntry = createImplementation({
    abstraction: DeleteEntryStorageOperation,
    implementation: DdbDeleteEntryImpl,
    dependencies: [CmsDdbEntryEntity, CmsDdbDataLoaders, CmsStorageModelProvider]
});
