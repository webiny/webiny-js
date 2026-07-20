import { createFeature } from "@webiny/feature/api";
import { CmsEntryOpenSearchFieldPathFactoryImpl } from "./CmsEntryOpenSearchFieldPathFactoryImpl.js";

export const CmsEntryOpenSearchFieldPathFactoryFeature = createFeature({
    name: "Cms/Entry/OpenSearch/FieldPathFactoryFeature",
    register: container => {
        container.register(CmsEntryOpenSearchFieldPathFactoryImpl);
    }
});
