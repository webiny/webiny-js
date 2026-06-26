import { createFeature } from "@webiny/feature/admin";
import { StoreWorkflowGateway } from "./StoreWorkflowGateway.js";
import { StoreWorkflowUseCase } from "./StoreWorkflowUseCase.js";

export const StoreWorkflowFeature = createFeature({
    name: "Workflows/StoreWorkflow",
    register(container) {
        container.register(StoreWorkflowGateway).inSingletonScope();
        container.register(StoreWorkflowUseCase);
    }
});
