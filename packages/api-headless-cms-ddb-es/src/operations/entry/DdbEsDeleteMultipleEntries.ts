import type {
    CmsModel,
    CmsEntryStorageOperationsDeleteEntriesParams
} from "@webiny/api-headless-cms/types/index.js";
import { DeleteMultipleEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteMultipleEntriesStorageOperation.js";
import { CmsDdbEsEntryEntity } from "~/abstractions/CmsDdbEsEntryEntity.js";
import { CmsDdbEsEntriesEsEntity } from "~/abstractions/CmsDdbEsEntriesEsEntity.js";
import { CmsDdbEsDataLoaders } from "~/abstractions/CmsDdbEsDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { createPartitionKey, createRevisionSortKey } from "./keys.js";

class DdbEsDeleteMultipleEntriesImpl implements DeleteMultipleEntriesStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEsEntryEntity.Interface,
        private esEntity: CmsDdbEsEntriesEsEntity.Interface,
        private dataLoaders: CmsDdbEsDataLoaders.Interface,
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
        const elasticsearchEntityBatch = this.esEntity.createEntityWriter();
        for (const id of entries) {
            /**
             * Latest item.
             */
            entityBatch.delete({
                PK: createPartitionKey({
                    id,
                    tenant: model.tenant
                }),
                SK: "L"
            });

            elasticsearchEntityBatch.delete({
                PK: createPartitionKey({
                    id,
                    tenant: model.tenant
                }),
                SK: "L"
            });

            /**
             * Published item.
             */
            entityBatch.delete({
                PK: createPartitionKey({
                    id,
                    tenant: model.tenant
                }),
                SK: "P"
            });

            elasticsearchEntityBatch.delete({
                PK: createPartitionKey({
                    id,
                    tenant: model.tenant
                }),
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
        await elasticsearchEntityBatch.execute();
    }
}

export const DdbEsDeleteMultipleEntries =
    DeleteMultipleEntriesStorageOperation.createImplementation({
        implementation: DdbEsDeleteMultipleEntriesImpl,
        dependencies: [
            CmsDdbEsEntryEntity,
            CmsDdbEsEntriesEsEntity,
            CmsDdbEsDataLoaders,
            CmsStorageModelProvider
        ]
    });
