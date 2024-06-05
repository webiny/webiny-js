import { CmsEntry, CmsEntryListParams, CmsEntryMeta } from "@webiny/api-headless-cms/types";
import { HcmsTasksContext } from "~/types";

export interface IListEntries {
    execute: (
        context: HcmsTasksContext,
        modelId: string,
        params: CmsEntryListParams
    ) => Promise<{ entries: CmsEntry[]; meta: CmsEntryMeta }>;
}
