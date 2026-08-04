import { createFeature } from "@webiny/feature/api";
import { BulkActionsEventBridgeLambdaHandler } from "./BulkActionsEventBridgeLambdaHandler.js";

export const BulkActionsEventBridgeLambdaHandlerFeature = createFeature({
    name: "BulkActionsEventBridgeLambdaHandler",
    register: container => {
        container.register(BulkActionsEventBridgeLambdaHandler);
    }
});
