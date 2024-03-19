import {
    CmsEntryStorageOperationsGetPublishedByIdsParams,
    CmsModel,
    CmsStorageEntry
} from "~/types";

export interface IGetPublishedEntriesByIds {
    execute: (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedByIdsParams
    ) => Promise<CmsStorageEntry[]>;
}
