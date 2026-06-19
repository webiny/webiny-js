import { createFeature } from "@webiny/feature/api/index.js";
import { OpenSearchIndexRegistry } from "./OpenSearchIndexRegistry.js";

export const OpenSearchIndexFeature = createFeature({
    name: "opensearch.internal.index",
    register(container) {
        container.register(OpenSearchIndexRegistry).inSingletonScope();
    }
});
