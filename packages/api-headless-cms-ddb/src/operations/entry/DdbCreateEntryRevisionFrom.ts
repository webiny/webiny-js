import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsCreateRevisionFromParams
} from "@webiny/api-headless-cms/types/index.js";
import { CONTENT_ENTRY_STATUS } from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { CreateEntryRevisionFromStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/CreateEntryRevisionFromStorageOperation.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import {
    createEntryLatestKeys,
    createEntryPublishedKeys,
    createEntryRevisionKeys
} from "~/operations/entry/keys.js";
import { convertToStorageEntry } from "./storageEntryUtils.js";

class DdbCreateEntryRevisionFromImpl implements CreateEntryRevisionFromStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEntryEntity.Interface,
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsCreateRevisionFromParams<T>
    ) {
        const { entry, storageEntry: initialStorageEntry } = params;
        const model = this.storageModelProvider.getModel(initialModel);

        const storageEntry = convertToStorageEntry({
            storageEntry: initialStorageEntry,
            model
        });

        /**
         * We need to:
         *  - create the main entry item
         *  - update the latest entry item to the current one
         *  - if the entry's status was set to "published":
         *      - update the published entry item to the current one
         *      - unpublish previously published revision (if any)
         */
        const entityBatch = this.entity.createEntityWriter({
            put: [
                {
                    ...createEntryRevisionKeys(storageEntry),
                    data: {
                        ...storageEntry
                    }
                },
                {
                    ...createEntryLatestKeys(storageEntry),
                    data: {
                        ...storageEntry
                    }
                }
            ]
        });

        const isPublished = entry.status === "published";
        if (isPublished) {
            entityBatch.put({
                ...createEntryPublishedKeys(storageEntry),
                data: {
                    ...storageEntry
                }
            });

            // Unpublish previously published revision (if any).
            const [publishedRevisionStorageEntry] =
                await this.dataLoaders.getPublishedRevisionByEntryId({
                    model,
                    ids: [entry.id]
                });

            if (publishedRevisionStorageEntry) {
                entityBatch.put({
                    ...createEntryRevisionKeys(publishedRevisionStorageEntry),
                    data: {
                        ...publishedRevisionStorageEntry,
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
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create revision from given entry.",
                ex.code || "CREATE_REVISION_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry
                }
            );
        }
        /**
         * There are no modifications on the entry created so just return the data.
         */
        return initialStorageEntry;
    }
}

export const DdbCreateEntryRevisionFrom = createImplementation({
    abstraction: CreateEntryRevisionFromStorageOperation,
    implementation: DdbCreateEntryRevisionFromImpl,
    dependencies: [CmsDdbEntryEntity, CmsDdbDataLoaders, CmsStorageModelProvider]
});
