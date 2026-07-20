import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createCreateOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["create"] => {
    return async (initialModel, createParams) => {
        await deps.syncHelpers.ensureSyncTable();
        const result = await deps.sqlOps.create(initialModel, createParams);
        const model = deps.getStorageOperationsModel(initialModel);
        await deps.syncHelpers.writeSyncForEntry(
            model,
            createParams.entry,
            createParams.storageEntry
        );
        return result;
    };
};
