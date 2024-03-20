import {
    CmsEntryStorageOperationsGetLatestRevisionParams,
    CmsModel,
    CmsStorageEntry
} from "~/types";

export interface IGetLatestRevisionByEntryId {
    execute: (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ) => Promise<CmsStorageEntry | null>;
}
