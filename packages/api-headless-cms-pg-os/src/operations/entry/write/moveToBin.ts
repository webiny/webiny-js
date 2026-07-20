import type {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsMoveToBinParams
} from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createMoveToBinOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["moveToBin"] => {
    return async (initialModel, moveToBinParams: CmsEntryStorageOperationsMoveToBinParams) => {
        await deps.syncHelpers.ensureSyncTable();
        await deps.sqlOps.moveToBin(initialModel, moveToBinParams);
        const model = deps.getStorageOperationsModel(initialModel);
        await deps.syncHelpers.resyncLatestAndPublishedFromPg(
            initialModel,
            model,
            moveToBinParams.entry.id
        );
    };
};
