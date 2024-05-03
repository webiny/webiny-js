import { ContentEntryListConfig as BaseContentEntryListConfig } from "./admin/config/contentEntries";
import { useContentEntriesList } from "./admin/hooks";
import { ContentEntries } from "~/admin/views/contentEntries/ContentEntries";

export const ContentEntryListConfig = Object.assign(BaseContentEntryListConfig, {
    ContentEntries: Object.assign(ContentEntries, {
        useContentEntriesList
    })
});
