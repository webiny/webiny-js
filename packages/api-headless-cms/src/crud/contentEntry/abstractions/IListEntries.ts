import { CmsEntry, CmsEntryListParams, CmsEntryMeta, CmsModel } from "~/types";

export interface IListEntries {
    execute: <T>(
        model: CmsModel,
        params?: CmsEntryListParams
    ) => Promise<[CmsEntry<T>[], CmsEntryMeta]>;
}
