import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsUpdateParams
} from "@webiny/api-headless-cms/types/index.js";
import { UpdateRevisionStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UpdateRevisionStorageOperation.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { createEntryRevisionKeys } from "~/operations/entry/keys.js";
import { convertToStorageEntry } from "./storageEntryUtils.js";

class DdbUpdateRevisionImpl implements UpdateRevisionStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEntryEntity.Interface,
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsUpdateParams<T>
    ) {
        const { entry, storageEntry: initialStorageEntry } = params;
        const model = this.storageModelProvider.getModel(initialModel);

        const storageEntry = convertToStorageEntry({
            model,
            storageEntry: initialStorageEntry
        });

        const entityBatch = this.entity.createEntityWriter({
            put: [
                {
                    ...createEntryRevisionKeys(storageEntry),
                    data: storageEntry
                }
            ]
        });

        try {
            await entityBatch.execute();
            this.dataLoaders.clearAll({
                tenant: entry.tenant
            });
            return initialStorageEntry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update revision.",
                ex.code || "UPDATE_REVISION_ERROR",
                {
                    error: ex,
                    entry
                }
            );
        }
    }
}

export const DdbUpdateRevision = UpdateRevisionStorageOperation.createImplementation({
    implementation: DdbUpdateRevisionImpl,
    dependencies: [CmsDdbEntryEntity, CmsDdbDataLoaders, CmsStorageModelProvider]
});
