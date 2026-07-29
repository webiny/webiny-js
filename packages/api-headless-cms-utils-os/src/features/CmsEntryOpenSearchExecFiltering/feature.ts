import { createFeature } from "@webiny/feature/api";
import { CmsEntryOpenSearchExecFiltering } from "./CmsEntryOpenSearchExecFilteringImpl.js";

export const CmsEntryOpenSearchExecFilteringFeature = createFeature({
    name: "Cms/Entry/OpenSearch/ExecFilteringFeature",
    register: container => {
        container.register(CmsEntryOpenSearchExecFiltering);
    }
});
