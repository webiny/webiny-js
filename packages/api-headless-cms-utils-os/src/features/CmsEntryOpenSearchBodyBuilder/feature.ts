import { createFeature } from "@webiny/feature/api";
import { CmsEntryOpenSearchBodyBuilderImpl } from "./CmsEntryOpenSearchBodyBuilderImpl.js";

export const CmsEntryOpenSearchBodyBuilderFeature = createFeature({
    name: "Cms/Entry/OpenSearch/BodyBuilderFeature",
    register: container => {
        container.register(CmsEntryOpenSearchBodyBuilderImpl);
    }
});
