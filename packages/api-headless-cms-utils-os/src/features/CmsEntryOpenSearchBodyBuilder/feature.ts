import { createFeature } from "@webiny/feature/api";
import { CmsEntryOpenSearchBodyBuilder } from "./CmsEntryOpenSearchBodyBuilder.js";

export const CmsEntryOpenSearchBodyBuilderFeature = createFeature({
    name: "Cms/Entry/OpenSearch/BodyBuilderFeature",
    register: container => {
        container.register(CmsEntryOpenSearchBodyBuilder);
    }
});
