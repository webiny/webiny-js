import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsPublishParams
} from "@webiny/api-headless-cms/types/index.js";
import { CONTENT_ENTRY_STATUS } from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { PublishEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/PublishEntryStorageOperation.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import {
    createEntryLatestKeys,
    createEntryPublishedKeys,
    createEntryRevisionKeys
} from "~/operations/entry/keys.js";
import {
    isEntryLevelEntryMetaField,
    pickEntryMetaFields
} from "@webiny/api-headless-cms/constants.js";
import { convertFromStorageEntry, convertToStorageEntry } from "./storageEntryUtils.js";

class DdbPublishEntryImpl implements PublishEntryStorageOperation.Interface {
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
        params: CmsEntryStorageOperationsPublishParams<T>
    ) {
        const { entry, storageEntry: initialStorageEntry } = params;
        const model = this.storageModelProvider.getModel(initialModel);

        /**
         * We need the latest and published entries to see if something needs to be updated alongside the publishing one.
         */
        const initialLatestStorageEntry = await this.getLatestRevisionByEntryId(model, entry);
        if (!initialLatestStorageEntry) {
            throw new WebinyError(
                `Could not publish entry. Could not load latest ("L") record.`,
                "PUBLISH_ERROR",
                { entry }
            );
        }

        const initialPublishedStorageEntry = await this.getPublishedRevisionByEntryId(model, entry);

        const storageEntry = convertToStorageEntry({
            model,
            storageEntry: initialStorageEntry
        });

        // 1. Update REV# and P records with new data.
        const entityBatch = this.entity.createEntityWriter({
            put: [
                {
                    ...createEntryRevisionKeys(storageEntry),
                    data: {
                        ...storageEntry
                    }
                },
                {
                    ...createEntryPublishedKeys(storageEntry),
                    data: {
                        ...storageEntry
                    }
                }
            ]
        });

        // 2. When it comes to the latest record, we need to perform a couple of different
        // updates, based on whether the entry being published is the latest revision or not.
        const publishedRevisionId = initialPublishedStorageEntry?.id;
        const publishingLatestRevision = entry.id === initialLatestStorageEntry.id;

        if (publishingLatestRevision) {
            // 2.1 If we're publishing the latest revision, we first need to update the L record.
            entityBatch.put({
                ...createEntryLatestKeys(storageEntry),
                data: {
                    ...storageEntry
                }
            });

            // 2.2 Additionally, if we have a previously published entry, we need to mark it as unpublished.
            if (publishedRevisionId && publishedRevisionId !== entry.id) {
                const publishedStorageEntry = convertToStorageEntry({
                    storageEntry: initialPublishedStorageEntry,
                    model
                });

                entityBatch.put({
                    ...createEntryRevisionKeys(publishedStorageEntry),
                    data: {
                        ...publishedStorageEntry,
                        status: CONTENT_ENTRY_STATUS.UNPUBLISHED
                    }
                });
            }
        } else {
            // 2.3 If the published revision is not the latest one, the situation is a bit
            // more complex. We first need to update the L and REV# records with the new
            // values of *only entry-level* meta fields.
            const updatedEntryLevelMetaFields = pickEntryMetaFields(
                entry,
                isEntryLevelEntryMetaField
            );

            const latestStorageEntry = convertToStorageEntry({
                storageEntry: initialLatestStorageEntry,
                model
            });

            // 2.3.1 Update L record. Apart from updating the entry-level meta fields, we also need
            //    to change the status from "published" to "unpublished" (if the status is set to "published").
            let latestRevisionStatus = latestStorageEntry.status;
            if (latestRevisionStatus === CONTENT_ENTRY_STATUS.PUBLISHED) {
                latestRevisionStatus = CONTENT_ENTRY_STATUS.UNPUBLISHED;
            }

            const latestStorageEntryFields = {
                ...latestStorageEntry,
                ...updatedEntryLevelMetaFields,
                status: latestRevisionStatus
            };

            entityBatch.put({
                ...createEntryLatestKeys(latestStorageEntryFields),
                data: {
                    ...latestStorageEntryFields
                }
            });

            // 2.3.2 Update REV# record.
            entityBatch.put({
                ...createEntryRevisionKeys(latestStorageEntryFields),
                data: {
                    ...latestStorageEntryFields
                }
            });

            // 2.3.3 Finally, if we got a published entry, but it wasn't the latest one, we need to take
            //    an extra step and mark it as unpublished.
            const publishedRevisionDifferentFromLatest =
                publishedRevisionId && publishedRevisionId !== latestStorageEntry.id;
            if (publishedRevisionDifferentFromLatest) {
                const publishedStorageEntry = convertToStorageEntry({
                    storageEntry: initialPublishedStorageEntry,
                    model
                });

                entityBatch.put({
                    ...createEntryRevisionKeys(publishedStorageEntry),
                    data: {
                        ...publishedStorageEntry,
                        status: CONTENT_ENTRY_STATUS.UNPUBLISHED
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
                ex.message || "Could not execute the publishing batch.",
                ex.code || "PUBLISH_ERROR",
                {
                    entry,
                    latestStorageEntry: initialLatestStorageEntry,
                    publishedStorageEntry: initialPublishedStorageEntry
                }
            );
        }
    }
}

export const DdbPublishEntry = createImplementation({
    abstraction: PublishEntryStorageOperation,
    implementation: DdbPublishEntryImpl,
    dependencies: [CmsDdbEntryEntity, CmsDdbDataLoaders, CmsStorageModelProvider]
});
