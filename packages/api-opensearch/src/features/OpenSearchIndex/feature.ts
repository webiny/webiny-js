import { createFeature } from "@webiny/feature/api/index.js";
import { OpenSearchIndexRegistryImpl } from "./OpenSearchIndexRegistryImpl.js";

export const OpenSearchIndexFeature = createFeature({
    name: "opensearch.internal.index",
    register(container) {
        container.register(OpenSearchIndexRegistryImpl).inSingletonScope();
    }
});
