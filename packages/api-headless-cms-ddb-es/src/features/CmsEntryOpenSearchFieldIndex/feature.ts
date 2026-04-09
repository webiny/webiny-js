import { createFeature } from "@webiny/feature/api";
import { CmsEntryOpenSearchFieldIndexRegistry } from "./CmsEntryOpenSearchFieldIndexRegistry.js";

export const CmsEntryOpenSearchFieldIndexFeature = createFeature({
    name: "Cms/Entry/OpenSearch/FieldIndexFeature",
    register: container => {
        container.register(CmsEntryOpenSearchFieldIndexRegistry);
    }
});
