import { CmsEntryStorageOperationsRestoreFromBinParams, CmsModel, CmsStorageEntry } from "~/types";

export interface IRestoreEntryFromBinOperation {
    execute: (
        model: CmsModel,
        options: CmsEntryStorageOperationsRestoreFromBinParams
    ) => Promise<CmsStorageEntry>;
}
