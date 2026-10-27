import { createFeature } from "@webiny/feature/api";
import { DeleteWorkflowUseCase } from "./DeleteWorkflowUseCase.js";

export const DeleteWorkflowFeature = createFeature({
    name: "Workflows/DeleteWorkflow",
    register(container) {
        container.register(DeleteWorkflowUseCase);
    }
});
