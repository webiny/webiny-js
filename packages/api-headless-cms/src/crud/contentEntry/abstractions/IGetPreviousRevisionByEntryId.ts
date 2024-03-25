import {
    CmsEntryStorageOperationsGetPreviousRevisionParams,
    CmsModel,
    CmsStorageEntry
} from "~/types";

export interface IGetPreviousRevisionByEntryId {
    execute: (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ) => Promise<CmsStorageEntry | null>;
}
