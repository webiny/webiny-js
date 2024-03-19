import { CmsEntryStorageOperationsGetRevisionsParams, CmsModel, CmsStorageEntry } from "~/types";

export interface IGetRevisionsByEntryId {
    execute: (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionsParams
    ) => Promise<CmsStorageEntry[]>;
}
