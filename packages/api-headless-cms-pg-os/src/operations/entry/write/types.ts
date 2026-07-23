import type {
    CmsEntryStorageOperations,
    CmsEntryValues,
    CmsModel,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { SyncHelpers } from "../syncHelpers.js";
import type { WriteEntry } from "~/features/SyncWriter/abstractions/WriteEntry.js";
import type { WriteLatest } from "~/features/SyncWriter/abstractions/WriteLatest.js";
import type { WritePublished } from "~/features/SyncWriter/abstractions/WritePublished.js";
import type { RemoveEntry } from "~/features/SyncWriter/abstractions/RemoveEntry.js";
import type { RemoveLatest } from "~/features/SyncWriter/abstractions/RemoveLatest.js";
import type { RemovePublished } from "~/features/SyncWriter/abstractions/RemovePublished.js";

export type GetStorageOperationsModel = <T extends CmsEntryValues = CmsEntryValues>(
    model: CmsModel
) => StorageOperationsCmsModel<T>;

export interface WriteOperationDeps {
    sqlOps: CmsEntryStorageOperations;
    syncHelpers: SyncHelpers;
    writeEntry: WriteEntry.Interface;
    writeLatest: WriteLatest.Interface;
    writePublished: WritePublished.Interface;
    removeEntry: RemoveEntry.Interface;
    removeLatest: RemoveLatest.Interface;
    removePublished: RemovePublished.Interface;
    getStorageOperationsModel: GetStorageOperationsModel;
}
