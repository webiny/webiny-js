import type {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsDeleteRevisionParams
} from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createDeleteRevisionOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["deleteRevision"] => {
    return async (
        initialModel,
        deleteRevisionParams: CmsEntryStorageOperationsDeleteRevisionParams
    ) => {
        await deps.syncHelpers.ensureSyncTable();
        await deps.sqlOps.deleteRevision(initialModel, deleteRevisionParams);
        const model = deps.getStorageOperationsModel(initialModel);

        const { latestStorageEntry, storageEntry } = deleteRevisionParams;
        if (latestStorageEntry) {
            await deps.syncWriter.writeLatest({
                model,
                entry: latestStorageEntry,
                storageEntry: latestStorageEntry
            });
        } else {
            await deps.syncWriter.removeLatest({ model, entryId: storageEntry.entryId });
        }

        if (storageEntry.status === "published") {
            await deps.syncWriter.removePublished({ model, entryId: storageEntry.entryId });
        }
    };
};
