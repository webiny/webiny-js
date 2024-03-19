import {
    CmsEntryStorageOperationsGetPublishedRevisionParams,
    CmsModel,
    CmsStorageEntry
} from "~/types";

export interface IGetPublishedRevisionByEntryId {
    execute: (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedRevisionParams
    ) => Promise<CmsStorageEntry | null>;
}
