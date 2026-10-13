import { createFeature } from "@webiny/feature/api";
import { RoutingEvaluatorService } from "./RoutingEvaluatorService.js";

export const RoutingEvaluatorFeature = createFeature({
    name: "Workflows/RoutingEvaluator",
    register(container) {
        container.register(RoutingEvaluatorService);
    }
});
