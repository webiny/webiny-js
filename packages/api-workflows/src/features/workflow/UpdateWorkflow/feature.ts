import { createFeature } from "@webiny/feature/api";
import { UpdateWorkflowUseCase } from "./UpdateWorkflowUseCase.js";
import { UpdateWorkflowRepository } from "./UpdateWorkflowRepository.js";

export const UpdateWorkflowFeature = createFeature({
    name: "Workflows/UpdateWorkflow",
    register(container) {
        container.register(UpdateWorkflowRepository).inSingletonScope();
        container.register(UpdateWorkflowUseCase);
    }
});
