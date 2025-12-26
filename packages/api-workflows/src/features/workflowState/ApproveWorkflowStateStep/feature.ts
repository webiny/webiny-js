import { createFeature } from "@webiny/feature/api";
import { ApproveWorkflowStateStepUseCase } from "./ApproveWorkflowStateStepUseCase.js";

export const ApproveWorkflowStateStepFeature = createFeature({
    name: "WorkflowState/ApproveWorkflowStateStep",
    register(container) {
        container.register(ApproveWorkflowStateStepUseCase);
    }
});
