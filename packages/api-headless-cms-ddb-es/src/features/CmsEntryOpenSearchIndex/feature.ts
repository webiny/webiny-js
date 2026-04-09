import { createFeature } from "@webiny/feature/api";
import { BaseOpenSearchIndex } from "./BaseOpenSearchIndex.js";

export const CmsEntryOpenSearchIndexFeature = createFeature({
    name: "Cms/Entry/OpenSearch/IndexFeature",
    register: container => {
        container.register(BaseOpenSearchIndex);
    }
});
