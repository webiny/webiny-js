import { CmsEntryStorageOperationsRestoreParams, CmsModel } from "~/types";

export interface IRestoreEntryOperation {
    execute: (model: CmsModel, options: CmsEntryStorageOperationsRestoreParams) => Promise<void>;
}
