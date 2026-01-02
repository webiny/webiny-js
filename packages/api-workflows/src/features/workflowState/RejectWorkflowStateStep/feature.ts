import { createFeature } from "@webiny/feature/api";
import { RejectWorkflowStateStepUseCase } from "./RejectWorkflowStateStepUseCase.js";

export const RejectWorkflowStateStepFeature = createFeature({
    name: "WorkflowState/RejectWorkflowStateStep",
    register(container) {
        container.register(RejectWorkflowStateStepUseCase);
    }
});
