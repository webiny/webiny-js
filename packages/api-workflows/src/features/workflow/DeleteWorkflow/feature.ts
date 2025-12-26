import { createFeature } from "@webiny/feature/api";
import { DeleteWorkflowUseCase } from "./DeleteWorkflowUseCase.js";
import { DeleteWorkflowRepository } from "./DeleteWorkflowRepository.js";

export const DeleteWorkflowFeature = createFeature({
    name: "Workflows/DeleteWorkflow",
    register(container) {
        container.register(DeleteWorkflowRepository).inSingletonScope();
        container.register(DeleteWorkflowUseCase);
    }
});
