import { createFeature } from "@webiny/feature/api";
import { UpdateWorkflowStateUseCase } from "./UpdateWorkflowStateUseCase.js";
import { UpdateWorkflowStateRepository } from "./UpdateWorkflowStateRepository.js";

export const UpdateWorkflowStateFeature = createFeature({
    name: "WorkflowState/UpdateWorkflowState",
    register(container) {
        container.register(UpdateWorkflowStateRepository).inSingletonScope();
        container.register(UpdateWorkflowStateUseCase);
    }
});
