import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsCreateParams
} from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import {
    createEntryLatestKeys,
    createEntryPublishedKeys,
    createEntryRevisionKeys
} from "~/operations/entry/keys.js";
import { convertToStorageEntry } from "./storageEntryUtils.js";

class DdbCreateEntryImpl implements CreateEntryStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEntryEntity.Interface,
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsCreateParams<T>
    ) {
        const { entry, storageEntry: initialStorageEntry } = params;
        const tenant = this.scopeTenant.getId();
        const model = this.storageModelProvider.getModel(initialModel);

        const isPublished = entry.status === "published";

        const locked = isPublished ? true : entry.locked;

        const storageEntry = {
            ...convertToStorageEntry({
                model,
                storageEntry: initialStorageEntry
            }),
            tenant
        };

        const storageEntryRevisionKeys = createEntryRevisionKeys(entry, tenant);
        const storageEntryLatestKeys = createEntryLatestKeys(entry, tenant);
        /**
         * We need to:
         *  - create new main entry item
         *  - create new or update the latest entry item
         */
        const entityBatch = this.entity.createEntityWriter({
            put: [
                {
                    ...storageEntryRevisionKeys,
                    data: {
                        ...storageEntry,
                        locked
                    }
                },
                {
                    ...storageEntryLatestKeys,
                    data: {
                        ...storageEntry,
                        locked
                    }
                }
            ]
        });

        /**
         * We need to create published entry if
         */
        if (isPublished) {
            const storageEntryPublishedKeys = createEntryPublishedKeys(storageEntry, tenant);
            entityBatch.put({
                ...storageEntryPublishedKeys,
                data: {
                    ...storageEntry,
                    locked
                }
            });
        }

        try {
            await entityBatch.execute();
            this.dataLoaders.clearAll({ tenant });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not insert data into the DynamoDB.",
                ex.code || "CREATE_ENTRY_ERROR",
                {
                    error: ex,
                    entry
                }
            );
        }

        return initialStorageEntry;
    }
}

export const DdbCreateEntry = CreateEntryStorageOperation.createImplementation({
    implementation: DdbCreateEntryImpl,
    dependencies: [CmsDdbEntryEntity, CmsDdbDataLoaders, CmsStorageModelProvider, ScopeTenant]
});
