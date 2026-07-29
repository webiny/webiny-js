import { createFeature } from "@webiny/feature/api";
import { CmsEntryOpenSearchIndexCreate } from "./CmsEntryOpenSearchIndexCreateImpl.js";

export const CmsEntryOpenSearchIndexCreateFeature = createFeature({
    name: "Cms/Entry/OpenSearch/IndexCreateFeature",
    register: container => {
        container.register(CmsEntryOpenSearchIndexCreate);
    }
});
