import { createFeature } from "@webiny/feature/api";
import { StartWorkflowStateStepUseCase } from "./StartWorkflowStateStepUseCase.js";

export const StartWorkflowStateStepFeature = createFeature({
    name: "WorkflowState/StartWorkflowStateStep",
    register(container) {
        container.register(StartWorkflowStateStepUseCase);
    }
});
