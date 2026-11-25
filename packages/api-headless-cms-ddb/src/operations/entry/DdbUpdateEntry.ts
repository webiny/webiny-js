import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsUpdateParams
} from "@webiny/api-headless-cms/types/index.js";
import { UpdateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UpdateEntryStorageOperation.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
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
import { convertToStorageEntry } from "./storageEntryUtils.js";

interface IGetLatestRevisionByEntryIdParams {
    id: string;
}

class DdbUpdateEntryImpl implements UpdateEntryStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEntryEntity.Interface,
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    private async getLatestRevisionByEntryId<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        tenant: string,
        params: IGetLatestRevisionByEntryIdParams
    ) {
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const items = await this.dataLoaders.getLatestRevisionByEntryId<T>({
            model: { tenant, modelId: model.modelId },
            ids: [params.id]
        });
        return items.shift() || null;
    }

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsUpdateParams<T>
    ) {
        const { entry, storageEntry: initialStorageEntry } = params;
        const tenant = this.scopeTenant.getId(
            initialModel.tenant,
            entry.tenant,
            initialStorageEntry.tenant
        );
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
        /**
         * We need to:
         *  - update the current entry
         *  - update the latest entry if the current entry is the latest one
         */

        const entityBatch = this.entity.createEntityWriter({
            put: [
                {
                    ...createEntryRevisionKeys(storageEntry, tenant),
                    data: {
                        ...storageEntry,
                        locked
                    }
                }
            ]
        });

        if (isPublished) {
            entityBatch.put({
                ...createEntryPublishedKeys(storageEntry, tenant),
                data: {
                    ...storageEntry,
                    locked
                }
            });
        }

        /**
         * We need the latest entry to update it as well if necessary.
         */
        const latestStorageEntry = await this.getLatestRevisionByEntryId(model, tenant, entry);

        if (latestStorageEntry) {
            const updatingLatestRevision = latestStorageEntry.id === entry.id;
            if (updatingLatestRevision) {
                entityBatch.put({
                    ...createEntryLatestKeys(storageEntry, tenant),
                    data: {
                        ...storageEntry,
                        locked
                    }
                });
            } else {
                /**
                 * If not updating latest revision, we still want to update the latest revision's
                 * entry-level meta fields to match the current revision's entry-level meta fields.
                 */
                const updatedEntryLevelMetaFields = pickEntryMetaFields(
                    entry,
                    isEntryLevelEntryMetaField
                );

                /**
                 * First we update the regular DynamoDB table. Two updates are needed:
                 * - one for the actual revision record
                 * - one for the latest record
                 */
                entityBatch.put({
                    ...createEntryRevisionKeys(latestStorageEntry, tenant),
                    data: {
                        ...latestStorageEntry,
                        ...updatedEntryLevelMetaFields
                    }
                });

                entityBatch.put({
                    ...createEntryLatestKeys(latestStorageEntry, tenant),
                    data: {
                        ...latestStorageEntry,
                        ...updatedEntryLevelMetaFields
                    }
                });
            }
        }

        try {
            await entityBatch.execute();
            this.dataLoaders.clearAll({ tenant });
            return initialStorageEntry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update entry.",
                ex.code || "UPDATE_ERROR",
                {
                    error: ex,
                    entry,
                    latestStorageEntry
                }
            );
        }
    }
}

export const DdbUpdateEntry = UpdateEntryStorageOperation.createImplementation({
    implementation: DdbUpdateEntryImpl,
    dependencies: [CmsDdbEntryEntity, CmsDdbDataLoaders, CmsStorageModelProvider, ScopeTenant]
});
