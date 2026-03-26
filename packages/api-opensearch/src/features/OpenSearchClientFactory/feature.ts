import { createFeature } from "@webiny/feature/api/index.js";
import { OpenSearchClientFactory } from "./OpenSearchClientFactory.js";

export const OpenSearchClientFactoryFeature = createFeature({
    name: "opensearch.internal.clientFactory",
    register(container) {
        container.register(OpenSearchClientFactory).inSingletonScope();
    }
});
