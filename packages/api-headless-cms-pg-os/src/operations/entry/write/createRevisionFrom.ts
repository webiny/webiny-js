import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createCreateRevisionFromOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["createRevisionFrom"] => {
    return async (initialModel, revisionParams) => {
        await deps.syncHelpers.ensureSyncTable();
        const result = await deps.sqlOps.createRevisionFrom(initialModel, revisionParams);
        const model = deps.getStorageOperationsModel(initialModel);
        await deps.syncHelpers.writeSyncForEntry(
            model,
            revisionParams.entry,
            revisionParams.storageEntry
        );
        return result;
    };
};
