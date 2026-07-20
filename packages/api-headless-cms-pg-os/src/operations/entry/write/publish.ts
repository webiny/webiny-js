import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createPublishOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["publish"] => {
    return async (initialModel, publishParams) => {
        await deps.syncHelpers.ensureSyncTable();
        const result = await deps.sqlOps.publish(initialModel, publishParams);
        const model = deps.getStorageOperationsModel(initialModel);
        await deps.syncWriter.writeEntry({
            model,
            entry: publishParams.entry,
            storageEntry: publishParams.storageEntry
        });
        return result;
    };
};
