import { CmsEntryStorageOperationsRestoreParams, CmsModel, CmsStorageEntry } from "~/types";

export interface IRestoreEntryOperation {
    execute: (
        model: CmsModel,
        options: CmsEntryStorageOperationsRestoreParams
    ) => Promise<CmsStorageEntry>;
}
