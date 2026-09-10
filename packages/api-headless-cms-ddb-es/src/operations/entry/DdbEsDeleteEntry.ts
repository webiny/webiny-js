import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryStorageOperationsDeleteParams
} from "@webiny/api-headless-cms/types/index.js";
import { DeleteEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteEntryStorageOperation.js";
import { CmsDdbEsEntryEntity } from "~/abstractions/CmsDdbEsEntryEntity.js";
import { CmsDdbEsEntriesEsEntity } from "~/abstractions/CmsDdbEsEntriesEsEntity.js";
import { CmsDdbEsDataLoaders } from "~/abstractions/CmsDdbEsDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { createPartitionKey } from "./keys.js";

class DdbEsDeleteEntryImpl implements DeleteEntryStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEsEntryEntity.Interface,
        private esEntity: CmsDdbEsEntriesEsEntity.Interface,
        private dataLoaders: CmsDdbEsDataLoaders.Interface,
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

        const items = await this.entity.queryAll({
            partitionKey,
            options: {
                gte: " "
            }
        });

        const esItems = await this.esEntity.queryAll({
            partitionKey,
            options: {
                gte: " "
            }
        });

        const entityBatch = this.entity.createEntityWriter({
            delete: items.map(item => {
                return {
                    PK: item.PK,
                    SK: item.SK
                };
            })
        });

        const elasticsearchEntityBatch = this.esEntity.createEntityWriter({
            delete: esItems.map(item => {
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
                ex.message || "Could not destroy entry records from DynamoDB table.",
                ex.code || "DELETE_ENTRY_ERROR",
                {
                    error: ex,
                    id
                }
            );
        }

        try {
            await elasticsearchEntityBatch.execute();
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not destroy entry records from DynamoDB Elasticsearch table.",
                ex.code || "DELETE_ENTRY_ERROR",
                {
                    error: ex,
                    id
                }
            );
        }
    }
}

export const DdbEsDeleteEntry = DeleteEntryStorageOperation.createImplementation({
    implementation: DdbEsDeleteEntryImpl,
    dependencies: [
        CmsDdbEsEntryEntity,
        CmsDdbEsEntriesEsEntity,
        CmsDdbEsDataLoaders,
        CmsStorageModelProvider
    ]
});
