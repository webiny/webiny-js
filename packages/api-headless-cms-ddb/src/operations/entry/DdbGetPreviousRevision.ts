import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetPreviousRevisionParams
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { GetPreviousRevisionStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetPreviousRevisionStorageOperation.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { createPartitionKey } from "~/operations/entry/keys.js";
import { convertFromStorageEntry } from "./storageEntryUtils.js";

class DdbGetPreviousRevisionImpl implements GetPreviousRevisionStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEntryEntity.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ) {
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const { entryId, version } = params;
        const partitionKey = createPartitionKey({
            tenant: model.tenant,
            id: entryId
        });

        const unfilteredRevisions = await this.entity.queryAll({
            partitionKey,
            options: {
                beginsWith: `REV#`,
                reverse: true
            }
        });
        const filteredRevisions = unfilteredRevisions.filter(item => {
            return item.data.version < version;
        });
        const storageEntry = filteredRevisions[0];
        if (!storageEntry) {
            return null;
        }

        try {
            return convertFromStorageEntry({
                storageEntry: storageEntry.data,
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not get previous version of given entry.",
                ex.code || "GET_PREVIOUS_VERSION_ERROR",
                {
                    ...params,
                    error: ex,
                    partitionKey,
                    model
                }
            );
        }
    }
}

export const DdbGetPreviousRevision = createImplementation({
    abstraction: GetPreviousRevisionStorageOperation,
    implementation: DdbGetPreviousRevisionImpl,
    dependencies: [CmsDdbEntryEntity, CmsStorageModelProvider]
});
