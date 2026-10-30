import { createFeature } from "@webiny/feature/api";
import { GetBoundWorkflowUseCase } from "./GetBoundWorkflowUseCase.js";

export const GetBoundWorkflowFeature = createFeature({
    name: "Workflows/GetBoundWorkflow",
    register(container) {
        container.register(GetBoundWorkflowUseCase);
    }
});
