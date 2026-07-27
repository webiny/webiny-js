import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsUnpublishParams
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { UnpublishEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UnpublishEntryStorageOperation.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import {
    createEntryLatestKeys,
    createEntryRevisionKeys,
    createPartitionKey,
    createPublishedSortKey
} from "~/operations/entry/keys.js";
import {
    isEntryLevelEntryMetaField,
    pickEntryMetaFields
} from "@webiny/api-headless-cms/constants.js";
import { convertFromStorageEntry, convertToStorageEntry } from "./storageEntryUtils.js";

class DdbUnpublishEntryImpl implements UnpublishEntryStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEntryEntity.Interface,
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    private async getLatestRevisionByEntryId<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: { id: string }
    ) {
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const items = await this.dataLoaders.getLatestRevisionByEntryId<T>({
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
        params: CmsEntryStorageOperationsUnpublishParams<T>
    ) {
        const { entry, storageEntry: initialStorageEntry } = params;
        const model = this.storageModelProvider.getModel(initialModel);

        const partitionKey = createPartitionKey({
            id: entry.id,
            tenant: model.tenant
        });

        const storageEntry = convertToStorageEntry({
            storageEntry: initialStorageEntry,
            model
        });
        /**
         * We need to:
         *  - delete currently published entry
         *  - update current entry revision with new data
         *  - update the latest entry status - if entry being unpublished is latest
         */
        const entityBatch = this.entity.createEntityWriter({
            delete: [
                {
                    PK: partitionKey,
                    SK: createPublishedSortKey()
                }
            ],
            put: [
                {
                    ...createEntryRevisionKeys(storageEntry),
                    data: {
                        ...storageEntry
                    }
                }
            ]
        });

        /**
         * We need the latest entry to see if something needs to be updated alongside the unpublishing one.
         */
        const initialLatestStorageEntry = await this.getLatestRevisionByEntryId(model, entry);

        if (initialLatestStorageEntry) {
            const unpublishingLatestRevision = entry.id === initialLatestStorageEntry.id;
            if (unpublishingLatestRevision) {
                entityBatch.put({
                    ...createEntryLatestKeys(storageEntry),
                    data: {
                        ...storageEntry
                    }
                });
            } else {
                const latestStorageEntry = convertToStorageEntry({
                    storageEntry: initialLatestStorageEntry,
                    model
                });

                // If the unpublished revision is not the latest one, we still need to
                // update the latest record with the new values of entry-level meta fields.
                const updatedEntryLevelMetaFields = pickEntryMetaFields(
                    entry,
                    isEntryLevelEntryMetaField
                );

                // 1. Update actual revision record.
                entityBatch.put({
                    ...createEntryRevisionKeys(latestStorageEntry),
                    data: {
                        ...latestStorageEntry,
                        ...updatedEntryLevelMetaFields
                    }
                });

                // 2. Update latest record.
                entityBatch.put({
                    ...createEntryLatestKeys(latestStorageEntry),
                    data: {
                        ...latestStorageEntry,
                        ...updatedEntryLevelMetaFields
                    }
                });
            }
        }

        try {
            await entityBatch.execute();
            this.dataLoaders.clearAll({
                tenant: entry.tenant
            });
            return initialStorageEntry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not execute unpublish batch.",
                ex.code || "UNPUBLISH_ERROR",
                {
                    entry,
                    storageEntry
                }
            );
        }
    }
}

export const DdbUnpublishEntry = createImplementation({
    abstraction: UnpublishEntryStorageOperation,
    implementation: DdbUnpublishEntryImpl,
    dependencies: [CmsDdbEntryEntity, CmsDdbDataLoaders, CmsStorageModelProvider]
});
