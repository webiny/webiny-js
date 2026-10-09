import { createFeature } from "@webiny/feature/api";
import { StoreWorkflowUseCase } from "./StoreWorkflowUseCase.js";

export const StoreWorkflowFeature = createFeature({
    name: "Workflows/StoreWorkflow",
    register(container) {
        // CreateWorkflowFeature and UpdateWorkflowFeature are registered by WorkflowsFeature.
        container.register(StoreWorkflowUseCase);
    }
});
