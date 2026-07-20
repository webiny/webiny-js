import type { CmsEntry, CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";

export interface CmsIndexEntry<T extends CmsEntryValues = CmsEntryValues> extends CmsEntry<T> {
    rawValues: Partial<T>;
    [key: string]: any;
}
