import { createFeature } from "@webiny/feature/api/index.js";
import { OpenSearchIndexRegistry } from "./OpenSearchIndexRegistry.js";

export const OpenSearchIndexFeature = createFeature({
    name: "opensearch.internal.index",
    register(container) {
        // Container scoped: each request builds the registry from its own container, so indexes that
        // extensions register per request are included. A singleton is built from the root only.
        container.register(OpenSearchIndexRegistry).inContainerScope();
    }
});
