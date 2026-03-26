import { createFeature } from "@webiny/feature/api/index.js";

import { OpenSearchClient } from "./OpenSearchClient.js";

export const OpenSearchClientFeature = createFeature({
    name: "opensearch.internal.client",
    register(container) {
        container.register(OpenSearchClient);
    }
});
