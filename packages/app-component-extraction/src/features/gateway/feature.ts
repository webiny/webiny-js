import { createFeature } from "@webiny/feature/admin";
import { ComponentExtractionGraphQLGateway } from "./ComponentExtractionGraphQLGateway.js";

export const ComponentExtractionGatewayFeature = createFeature({
    name: "ComponentExtraction/Gateway",
    register(container) {
        container.register(ComponentExtractionGraphQLGateway).inSingletonScope();
    },
    resolve() {
        return {};
    }
});
