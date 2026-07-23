import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createUnpublishOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["unpublish"] => {
    return async (initialModel, unpublishParams) => {
        await deps.syncHelpers.ensureSyncTable();
        const result = await deps.sqlOps.unpublish(initialModel, unpublishParams);
        const model = deps.getStorageOperationsModel(initialModel);
        await deps.writeLatest.execute({
            model,
            entry: unpublishParams.entry,
            storageEntry: unpublishParams.storageEntry
        });
        await deps.removePublished.execute({ model, entryId: unpublishParams.entry.entryId });
        return result;
    };
};
