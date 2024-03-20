import { CmsEntryStorageOperationsGetLatestByIdsParams, CmsModel, CmsStorageEntry } from "~/types";

export interface IGetLatestEntriesByIds {
    execute: (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestByIdsParams
    ) => Promise<CmsStorageEntry[]>;
}
