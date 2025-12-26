import { createFeature } from "@webiny/feature/api";
import { CancelWorkflowStateUseCase } from "./CancelWorkflowStateUseCase.js";

export const CancelWorkflowStateFeature = createFeature({
    name: "WorkflowState/CancelWorkflowState",
    register(container) {
        container.register(CancelWorkflowStateUseCase);
    }
});
