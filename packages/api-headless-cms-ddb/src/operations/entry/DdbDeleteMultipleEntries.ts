import type {
    CmsModel,
    CmsEntryStorageOperationsDeleteEntriesParams
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { DeleteMultipleEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteMultipleEntriesStorageOperation.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { createPartitionKey, createRevisionSortKey } from "~/operations/entry/keys.js";

class DdbDeleteMultipleEntriesImpl implements DeleteMultipleEntriesStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEntryEntity.Interface,
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute(initialModel: CmsModel, params: CmsEntryStorageOperationsDeleteEntriesParams) {
        const { entries } = params;
        const model = this.storageModelProvider.getModel(initialModel);
        /**
         * First we need all the revisions of the entries we want to delete.
         */
        const revisions = await this.dataLoaders.getAllEntryRevisions({
            model,
            ids: entries
        });
        /**
         * Then we need to construct the queries for all the revisions and entries.
         */

        const entityBatch = this.entity.createEntityWriter();

        for (const id of entries) {
            const partitionKey = createPartitionKey({
                id,
                tenant: model.tenant
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
                    tenant: model.tenant
                }),
                SK: createRevisionSortKey({
                    version: revision.version
                })
            });
        }

        await entityBatch.execute();
    }
}

export const DdbDeleteMultipleEntries = createImplementation({
    abstraction: DeleteMultipleEntriesStorageOperation,
    implementation: DdbDeleteMultipleEntriesImpl,
    dependencies: [CmsDdbEntryEntity, CmsDdbDataLoaders, CmsStorageModelProvider]
});
