import { CmsEntryStorageOperationsGetByIdsParams, CmsModel, CmsStorageEntry } from "~/types";

export interface IGetEntriesByIds {
    execute: (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetByIdsParams
    ) => Promise<CmsStorageEntry[]>;
}
