import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetPreviousRevisionParams
} from "@webiny/api-headless-cms/types/index.js";
import { GetPreviousRevisionStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetPreviousRevisionStorageOperation.js";
import { CmsDdbEsEntryEntity } from "~/abstractions/CmsDdbEsEntryEntity.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { createPartitionKey } from "./keys.js";
import { convertEntryKeysFromStorage } from "./transformations/convertEntryKeys.js";
import type { IEntityQueryAllParams } from "@webiny/db-dynamodb";

class DdbEsGetPreviousRevisionImpl implements GetPreviousRevisionStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEsEntryEntity.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ) {
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const { tenant } = model;
        const { entryId, version } = params;

        const partitionKey = createPartitionKey({
            tenant,
            id: entryId
        });
        const options: IEntityQueryAllParams["options"] = {
            beginsWith: `REV#`,
            reverse: true
        };

        try {
            const unfilteredEntries = (
                await this.entity.queryAll({
                    partitionKey,
                    options
                })
            ).map(item => {
                return item.data;
            });

            const entries = unfilteredEntries.filter(item => {
                return item.version < version;
            });

            const entry = entries[0];

            if (!entry) {
                return null;
            }
            return convertEntryKeysFromStorage<T>({
                entry,
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
                    options,
                    model
                }
            );
        }
    }
}

export const DdbEsGetPreviousRevision = GetPreviousRevisionStorageOperation.createImplementation({
    implementation: DdbEsGetPreviousRevisionImpl,
    dependencies: [CmsDdbEsEntryEntity, CmsStorageModelProvider]
});
