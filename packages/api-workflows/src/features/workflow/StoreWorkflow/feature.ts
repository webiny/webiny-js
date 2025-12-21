import { createFeature } from "@webiny/feature/api";
import { StoreWorkflowUseCase } from "./StoreWorkflowUseCase.js";
import { CreateWorkflowFeature } from "../CreateWorkflow/index.js";
import { UpdateWorkflowFeature } from "../UpdateWorkflow/index.js";

export const StoreWorkflowFeature = createFeature({
    name: "Workflows/StoreWorkflow",
    register(container) {
        // Register dependencies
        CreateWorkflowFeature.register(container);
        UpdateWorkflowFeature.register(container);

        // Register StoreWorkflow use case
        container.register(StoreWorkflowUseCase);
    }
});
