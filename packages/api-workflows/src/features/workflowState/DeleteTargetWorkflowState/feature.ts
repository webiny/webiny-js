import { createFeature } from "@webiny/feature/api";
import { DeleteTargetWorkflowStateUseCase } from "./DeleteTargetWorkflowStateUseCase.js";

export const DeleteTargetWorkflowStateFeature = createFeature({
    name: "WorkflowState/DeleteTargetWorkflowState",
    register(container) {
        container.register(DeleteTargetWorkflowStateUseCase);
    }
});
