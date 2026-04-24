import { createFeature } from "@webiny/feature/api";
import { CreateWorkflowUseCase } from "./CreateWorkflowUseCase.js";
import { CreateWorkflowRepository } from "./CreateWorkflowRepository.js";

export const CreateWorkflowFeature = createFeature({
    name: "Workflows/CreateWorkflow",
    register(container) {
        container.register(CreateWorkflowRepository).inSingletonScope();
        container.register(CreateWorkflowUseCase);
    }
});
