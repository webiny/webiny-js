import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsRestoreFromBinParams,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import { RestoreFromBinStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/RestoreFromBinStorageOperation.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { createPartitionKey } from "~/operations/entry/keys.js";
import {
    isRestoredEntryMetaField,
    pickEntryMetaFields
} from "@webiny/api-headless-cms/constants.js";
import { convertToStorageEntry } from "./storageEntryUtils.js";

class DdbRestoreFromBinImpl implements RestoreFromBinStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEntryEntity.Interface,
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsRestoreFromBinParams<T>
    ): Promise<CmsStorageEntry<T>> {
        const { entry, storageEntry: initialStorageEntry } = params;
        const model = this.storageModelProvider.getModel(initialModel);

        /**
         * First we need to load all the revisions and published / latest entries.
         */
        let records: Awaited<ReturnType<typeof this.entity.queryAll>> = [];
        try {
            records = await this.entity.queryAll({
                partitionKey: createPartitionKey({
                    id: entry.id,
                    tenant: model.tenant
                }),
                options: {
                    gte: " "
                }
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load all records.",
                ex.code || "LOAD_ALL_RECORDS_ERROR",
                {
                    error: ex,
                    id: entry.id
                }
            );
        }
        if (records.length === 0) {
            return initialStorageEntry;
        }

        const storageEntry = convertToStorageEntry({
            model,
            storageEntry: initialStorageEntry
        });

        /**
         * Let's pick the `restored` meta fields from the storage entry.
         */
        const updatedRestoredMetaFields = pickEntryMetaFields(
            storageEntry,
            isRestoredEntryMetaField
        );

        const entityBatch = this.entity.createEntityWriter({
            put: records.map(record => {
                return {
                    ...record,
                    data: {
                        ...record.data,
                        ...updatedRestoredMetaFields,
                        wbyDeleted: storageEntry.wbyDeleted,
                        location: storageEntry.location,
                        binOriginalFolderId: storageEntry.binOriginalFolderId
                    }
                };
            })
        });

        /**
         * And finally write it...
         */
        try {
            await entityBatch.execute();

            this.dataLoaders.clearAll({
                tenant: entry.tenant
            });

            return initialStorageEntry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not restore the entry from the bin.",
                ex.code || "RESTORE_ENTRY_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry
                }
            );
        }
    }
}

export const DdbRestoreFromBin = RestoreFromBinStorageOperation.createImplementation({
    implementation: DdbRestoreFromBinImpl,
    dependencies: [CmsDdbEntryEntity, CmsDdbDataLoaders, CmsStorageModelProvider]
});
