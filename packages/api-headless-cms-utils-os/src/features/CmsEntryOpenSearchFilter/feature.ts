import { createFeature } from "@webiny/feature/api";
import { DefaultFilter } from "./fields/DefaultFilter.js";
import { RefFilter } from "./fields/RefFilter.js";
import { ObjectFilter } from "./fields/ObjectFilter.js";
import { CmsEntryOpenSearchFilterRegistry } from "./CmsEntryOpenSearchFilterRegistry.js";

export const CmsEntryOpenSearchFilterFeature = createFeature({
    name: "Cms/Entry/OpenSearch/FilterFeature",
    register: container => {
        container.register(DefaultFilter);
        container.register(RefFilter);
        container.register(ObjectFilter);
        container.register(CmsEntryOpenSearchFilterRegistry);
    }
});
