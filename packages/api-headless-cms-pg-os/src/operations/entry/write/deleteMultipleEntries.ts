import type {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsDeleteEntriesParams
} from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";
import {parseIdentifier} from "@webiny/utils";

export const createDeleteMultipleEntriesOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["deleteMultipleEntries"] => {
    return async (
        initialModel,
        deleteMultipleParams: CmsEntryStorageOperationsDeleteEntriesParams
    ) => {
        await deps.syncHelpers.ensureSyncTable();
        const model = deps.getStorageOperationsModel(initialModel);
        await deps.sqlOps.deleteMultipleEntries(initialModel, deleteMultipleParams);

        for (const id of deleteMultipleParams.entries) {
            const {id: entryId} = parseIdentifier(id);
            await deps.syncWriter.removeEntry({
                model,
                entryId
            });
        }
    };
};
