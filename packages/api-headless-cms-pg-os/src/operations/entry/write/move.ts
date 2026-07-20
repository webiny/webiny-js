import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createMoveOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["move"] => {
    return async (initialModel, id, folderId) => {
        await deps.syncHelpers.ensureSyncTable();
        await deps.sqlOps.move(initialModel, id, folderId);
        const model = deps.getStorageOperationsModel(initialModel);
        await deps.syncHelpers.resyncLatestAndPublishedFromPg(initialModel, model, id);
    };
};
