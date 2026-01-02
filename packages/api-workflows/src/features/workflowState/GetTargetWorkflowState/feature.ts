import { createFeature } from "@webiny/feature/api";
import { GetTargetWorkflowStateUseCase } from "./GetTargetWorkflowStateUseCase.js";
import { GetTargetWorkflowStateRepository } from "./GetTargetWorkflowStateRepository.js";

export const GetTargetWorkflowStateFeature = createFeature({
    name: "WorkflowState/GetTargetWorkflowState",
    register(container) {
        container.register(GetTargetWorkflowStateRepository).inSingletonScope();
        container.register(GetTargetWorkflowStateUseCase);
    }
});
