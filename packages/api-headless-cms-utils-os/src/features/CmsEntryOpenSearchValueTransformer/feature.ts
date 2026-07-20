import { createFeature } from "@webiny/feature/api";
import { CmsEntryOpenSearchValueTransformerImpl } from "./CmsEntryOpenSearchValueTransformerImpl.js";

export const CmsEntryOpenSearchValueTransformerFeature = createFeature({
    name: "Cms/Entry/OpenSearch/ValueTransformerFeature",
    register: container => {
        container.register(CmsEntryOpenSearchValueTransformerImpl);
    }
});
