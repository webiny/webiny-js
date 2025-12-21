import { createFeature } from "@webiny/feature/api";
import { GetWorkflowStateUseCase } from "./GetWorkflowStateUseCase.js";
import { GetWorkflowStateRepository } from "./GetWorkflowStateRepository.js";

export const GetWorkflowStateFeature = createFeature({
    name: "WorkflowState/GetWorkflowState",
    register(container) {
        container.register(GetWorkflowStateRepository).inSingletonScope();
        container.register(GetWorkflowStateUseCase);
    }
});
