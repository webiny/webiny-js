import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createRestoreFromBinOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["restoreFromBin"] => {
    return async (initialModel, restoreParams) => {
        await deps.syncHelpers.ensureSyncTable();
        const result = await deps.sqlOps.restoreFromBin(initialModel, restoreParams);
        const model = deps.getStorageOperationsModel(initialModel);
        await deps.syncHelpers.resyncLatestAndPublishedFromPg(
            initialModel,
            model,
            restoreParams.entry.id
        );
        return result;
    };
};
