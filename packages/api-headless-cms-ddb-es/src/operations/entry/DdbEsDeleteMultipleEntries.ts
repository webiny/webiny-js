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
         * The Elasticsearch records that exist: an entry that was never published (or was
         * unpublished) has no published record, and deleting a missing record is an error in the
         * stream handling. As DdbEsDeleteEntry does, only the stored records are deleted.
         */
        const esItems = (
            await Promise.all(
                entries.map(id =>
                    this.esEntity.queryAll({
                        partitionKey: createPartitionKey({
                            id,
                            tenant: model.tenant
                        }),
                        options: {
                            gte: " "
                        }
                    })
                )
            )
        ).flat();

        const entityBatch = this.entity.createEntityWriter();
        const elasticsearchEntityBatch = this.esEntity.createEntityWriter({
            delete: esItems.map(item => ({ PK: item.PK, SK: item.SK }))
        });
        for (const id of entries) {
            const partitionKey = createPartitionKey({
                id,
                tenant: model.tenant
            });
            /**
             * Latest and published items.
             */
            entityBatch.delete({ PK: partitionKey, SK: "L" });
            entityBatch.delete({ PK: partitionKey, SK: "P" });
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

        this.dataLoaders.clearAll({
            tenant: model.tenant
        });
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
