import { createFeature } from "@webiny/feature/api/index.js";
import { OpenSearchIndexRegistry } from "./OpenSearchIndexRegistry.js";

export const OpenSearchIndexFeature = createFeature({
    name: "opensearch.internal.index",
    register(container) {
        // Container scoped: each request builds the registry from its own container, so indexes that
        // extensions register per request are included. As a singleton it would be built once, from
        // the root container's registrations only (@webiny/di builds a singleton from the container
        // that registers it), and would never see indexes registered in a request container.
        container.register(OpenSearchIndexRegistry).inContainerScope();
    }
});
