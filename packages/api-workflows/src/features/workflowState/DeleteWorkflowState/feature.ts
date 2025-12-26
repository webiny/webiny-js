import { createFeature } from "@webiny/feature/api";
import { DeleteWorkflowStateUseCase } from "./DeleteWorkflowStateUseCase.js";
import { DeleteWorkflowStateRepository } from "./DeleteWorkflowStateRepository.js";

export const DeleteWorkflowStateFeature = createFeature({
    name: "WorkflowState/DeleteWorkflowState",
    register(container) {
        container.register(DeleteWorkflowStateRepository).inSingletonScope();
        container.register(DeleteWorkflowStateUseCase);
    }
});
