import { createFeature } from "@webiny/feature/api/index.js";
import { OpenSearchFieldFactory } from "./OpenSearchFieldFactory.js";

export const OpenSearchFieldFeature = createFeature({
    name: "opensearch.internal.field",
    register(container) {
        container.register(OpenSearchFieldFactory).inSingletonScope();
    }
});
