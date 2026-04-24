import { createFeature } from "@webiny/feature/api";
import ProvidersHandler from "./ProvidersHandler.js";
import ProvidersGraphQLMapper from "./ProvidersGraphQLMapper.js";

export const ProvidersFeature = createFeature({
    name: "AiPowerUpsProviders",
    register(container) {
        container.register(ProvidersHandler);
        container.register(ProvidersGraphQLMapper);
    }
});
