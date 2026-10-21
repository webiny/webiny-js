import { createFeature } from "@webiny/feature/api";
import { RoutingStrategyService } from "./RoutingStrategyService.js";

export const RoutingStrategyFeature = createFeature({
    name: "Workflows/RoutingStrategy",
    register(container) {
        container.register(RoutingStrategyService);
    }
});
