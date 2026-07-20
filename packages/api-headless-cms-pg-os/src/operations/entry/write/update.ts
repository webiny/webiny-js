import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createUpdateOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["update"] => {
    return async (initialModel, updateParams) => {
        await deps.syncHelpers.ensureSyncTable();
        const result = await deps.sqlOps.update(initialModel, updateParams);
        const model = deps.getStorageOperationsModel(initialModel);
        await deps.syncHelpers.writeSyncForEntry(
            model,
            updateParams.entry,
            updateParams.storageEntry
        );
        return result;
    };
};
