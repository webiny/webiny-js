import { createFeature } from "@webiny/feature/api";
import { CmsEntryOpenSearchIndexDelete } from "./CmsEntryOpenSearchIndexDelete.js";

export const CmsEntryOpenSearchIndexDeleteFeature = createFeature({
    name: "Cms/Entry/OpenSearch/IndexDeleteFeature",
    register: container => {
        container.register(CmsEntryOpenSearchIndexDelete);
    }
});
