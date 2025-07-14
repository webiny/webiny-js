import type {
    CmsEntry,
    CmsEntryMeta,
    CmsEntryStorageOperationsListParams,
    CmsEntryValues,
    CmsModel
} from "~/types";

export interface IListEntries {
    execute: <T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ) => Promise<[CmsEntry<T>[], CmsEntryMeta]>;
}
