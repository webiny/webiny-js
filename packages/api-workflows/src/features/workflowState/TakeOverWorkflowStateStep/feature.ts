import { createFeature } from "@webiny/feature/api";
import { TakeOverWorkflowStateStepUseCase } from "./TakeOverWorkflowStateStepUseCase.js";

export const TakeOverWorkflowStateStepFeature = createFeature({
    name: "WorkflowState/TakeOverWorkflowStateStep",
    register(container) {
        container.register(TakeOverWorkflowStateStepUseCase);
    }
});
