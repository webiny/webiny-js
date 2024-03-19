import {
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsListResponse,
    CmsModel
} from "~/types";

export interface IListEntriesOperation {
    execute: (
        model: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ) => Promise<CmsEntryStorageOperationsListResponse>;
}
