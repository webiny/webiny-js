import type {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsDeleteParams
} from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createDeleteEntryOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["delete"] => {
    return async (initialModel, deleteParams: CmsEntryStorageOperationsDeleteParams) => {
        await deps.syncHelpers.ensureSyncTable();
        const model = deps.getStorageOperationsModel(initialModel);
        const { entryId } = deleteParams.entry;
        await deps.sqlOps.delete(initialModel, deleteParams);
        await deps.removeEntry.execute({ model, entryId });
    };
};
