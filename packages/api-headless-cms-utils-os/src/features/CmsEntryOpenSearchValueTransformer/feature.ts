import { createFeature } from "@webiny/feature/api";
import { CmsEntryOpenSearchValueTransformer } from "./CmsEntryOpenSearchValueTransformer.js";

export const CmsEntryOpenSearchValueTransformerFeature = createFeature({
    name: "Cms/Entry/OpenSearch/ValueTransformerFeature",
    register: container => {
        container.register(CmsEntryOpenSearchValueTransformer);
    }
});
