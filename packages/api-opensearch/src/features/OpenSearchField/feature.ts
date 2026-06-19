import { createFeature } from "@webiny/feature/api/index.js";
import { OpenSearchFieldFactoryImpl } from "./OpenSearchFieldFactoryImpl.js";

export const OpenSearchFieldFeature = createFeature({
    name: "opensearch.internal.field",
    register(container) {
        container.register(OpenSearchFieldFactoryImpl).inSingletonScope();
    }
});
