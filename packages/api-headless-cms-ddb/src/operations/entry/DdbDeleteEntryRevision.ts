import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsDeleteRevisionParams
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { DeleteEntryRevisionStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteEntryRevisionStorageOperation.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import {
    createEntryLatestKeys,
    createEntryRevisionKeys,
    createPartitionKey,
    createPublishedSortKey,
    createRevisionSortKey
} from "~/operations/entry/keys.js";
import { convertFromStorageEntry, convertToStorageEntry } from "./storageEntryUtils.js";

class DdbDeleteEntryRevisionImpl implements DeleteEntryRevisionStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEntryEntity.Interface,
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    private async getPublishedRevisionByEntryId<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: { id: string }
    ) {
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const items = await this.dataLoaders.getPublishedRevisionByEntryId<T>({
            model,
            ids: [params.id]
        });
        const item = items.shift() || null;
        if (!item) {
            return null;
        }
        return convertFromStorageEntry({
            storageEntry: item,
            model
        });
    }

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsDeleteRevisionParams<T>
    ) {
        const { entry, latestEntry, latestStorageEntry: initialLatestStorageEntry } = params;

        const model = this.storageModelProvider.getModel(initialModel);

        const partitionKey = createPartitionKey({
            id: entry.id,
            tenant: model.tenant
        });

        const entityBatch = this.entity.createEntityWriter({
            delete: [
                {
                    PK: partitionKey,
                    SK: createRevisionSortKey(entry)
                }
            ]
        });

        const publishedStorageEntry = await this.getPublishedRevisionByEntryId(model, entry);

        /**
         * If revision we are deleting is the published one as well, we need to delete those records as well.
         */
        if (publishedStorageEntry && entry.id === publishedStorageEntry.id) {
            entityBatch.delete({
                PK: partitionKey,
                SK: createPublishedSortKey()
            });
        }

        if (initialLatestStorageEntry) {
            const latestStorageEntry = convertToStorageEntry({
                storageEntry: initialLatestStorageEntry,
                model
            });
            entityBatch.put({
                ...createEntryLatestKeys(latestStorageEntry),
                data: {
                    ...latestStorageEntry
                }
            });

            // Do an update on the latest revision. We need to update the latest revision's
            // entry-level meta fields to match the previous revision's entry-level meta fields.
            entityBatch.put({
                ...createEntryRevisionKeys(latestStorageEntry),
                data: {
                    ...latestStorageEntry
                }
            });
        }
        try {
            await entityBatch.execute();

            this.dataLoaders.clearAll({
                tenant: entry.tenant
            });
        } catch (ex) {
            throw new WebinyError(ex.message, ex.code, {
                error: ex,
                entry,
                latestEntry
            });
        }
    }
}

export const DdbDeleteEntryRevision = createImplementation({
    abstraction: DeleteEntryRevisionStorageOperation,
    implementation: DdbDeleteEntryRevisionImpl,
    dependencies: [CmsDdbEntryEntity, CmsDdbDataLoaders, CmsStorageModelProvider]
});
