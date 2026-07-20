import type {
    CmsEntryStorageOperations,
    CmsEntryValues,
    CmsModel,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { SyncHelpers } from "../syncHelpers.js";
import type { SyncWriter } from "../syncWriter.js";

export type GetStorageOperationsModel = <T extends CmsEntryValues = CmsEntryValues>(
    model: CmsModel
) => StorageOperationsCmsModel<T>;

export interface WriteOperationDeps {
    sqlOps: CmsEntryStorageOperations;
    syncHelpers: SyncHelpers;
    syncWriter: SyncWriter;
    getStorageOperationsModel: GetStorageOperationsModel;
}
