import { createFeature } from "@webiny/feature/api";
import { CmsEntryOpenSearchFieldPathFactory } from "./CmsEntryOpenSearchFieldPathFactory.js";

export const CmsEntryOpenSearchFieldPathFactoryFeature = createFeature({
    name: "Cms/Entry/OpenSearch/FieldPathFactoryFeature",
    register: container => {
        container.register(CmsEntryOpenSearchFieldPathFactory);
    }
});
