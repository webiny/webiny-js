import { createFeature } from "@webiny/feature/api";
import { RefSearch } from "./fields/RefSearch.js";
import { SearchableJsonSearch } from "./fields/SearchableJsonSearch.js";
import { TimeSearch } from "./fields/TimeSearch.js";

export const CmsEntryOpenSearchValueSearchFeature = createFeature({
    name: "Cms/Entry/OpenSearch/ValueSearchFeature",
    register: container => {
        container.register(RefSearch);
        container.register(SearchableJsonSearch);
        container.register(TimeSearch);
    }
});
