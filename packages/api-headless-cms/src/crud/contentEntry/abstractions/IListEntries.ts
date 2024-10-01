import { CmsEntry, CmsEntryListParams, CmsEntryMeta, CmsEntryValues, CmsModel } from "~/types";

export interface IListEntries {
    execute: <T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ) => Promise<[CmsEntry<T>[], CmsEntryMeta]>;
}
