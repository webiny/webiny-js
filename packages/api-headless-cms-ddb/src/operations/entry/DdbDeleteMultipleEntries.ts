import type {
    CmsModel,
    CmsEntryStorageOperationsDeleteEntriesParams
} from "@webiny/api-headless-cms/types/index.js";
import { DeleteMultipleEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteMultipleEntriesStorageOperation.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { createPartitionKey, createRevisionSortKey } from "~/operations/entry/keys.js";

class DdbDeleteMultipleEntriesImpl implements DeleteMultipleEntriesStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEntryEntity.Interface,
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute(initialModel: CmsModel, params: CmsEntryStorageOperationsDeleteEntriesParams) {
        const { entries } = params;
        const tenant = this.scopeTenant.getId(initialModel.tenant);
        const model = this.storageModelProvider.getModel(initialModel);
        /**
         * First we need all the revisions of the entries we want to delete.
         */
        const revisions = await this.dataLoaders.getAllEntryRevisions({
            model: { tenant, modelId: model.modelId },
            ids: entries
        });
        /**
         * Then we need to construct the queries for all the revisions and entries.
         */

        const entityBatch = this.entity.createEntityWriter();

        for (const id of entries) {
            const partitionKey = createPartitionKey({
                id,
                tenant
            });
            entityBatch.delete({
                PK: partitionKey,
                SK: "L"
            });
            entityBatch.delete({
                PK: partitionKey,
                SK: "P"
            });
        }
        /**
         * Exact revisions of all the entries
         */
        for (const revision of revisions) {
            entityBatch.delete({
                PK: createPartitionKey({
                    id: revision.id,
                    tenant
                }),
                SK: createRevisionSortKey({
                    version: revision.version
                })
            });
        }

        await entityBatch.execute();

        this.dataLoaders.clearAll({ tenant });
    }
}

export const DdbDeleteMultipleEntries = DeleteMultipleEntriesStorageOperation.createImplementation({
    implementation: DdbDeleteMultipleEntriesImpl,
    dependencies: [CmsDdbEntryEntity, CmsDdbDataLoaders, CmsStorageModelProvider, ScopeTenant]
});
