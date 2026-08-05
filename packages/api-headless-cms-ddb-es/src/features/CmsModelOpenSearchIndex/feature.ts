import { createFeature } from "@webiny/feature/api/index.js";
import { DefaultCmsModelOpenSearchIndex } from "./DefaultCmsModelOpenSearchIndex.js";
import { DefaultCmsModelOpenSearchIndexProvider } from "./CmsModelOpenSearchIndexProvider.js";

export const CmsModelOpenSearchIndexFeature = createFeature({
    name: "Cms/Model/OpenSearch/IndexFeature",
    register: container => {
        container.register(DefaultCmsModelOpenSearchIndex);
        container.register(DefaultCmsModelOpenSearchIndexProvider).inSingletonScope();
    }
});
