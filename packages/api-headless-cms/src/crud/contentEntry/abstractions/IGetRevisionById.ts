import { CmsEntryStorageOperationsGetRevisionParams, CmsModel, CmsStorageEntry } from "~/types";

export interface IGetRevisionById {
    execute: (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionParams
    ) => Promise<CmsStorageEntry | null>;
}
