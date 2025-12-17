import { createFeature } from "@webiny/feature/api";
import { ListRequestedWorkflowStatesUseCase } from "./ListRequestedWorkflowStatesUseCase.js";

export const ListRequestedWorkflowStatesFeature = createFeature({
    name: "WorkflowState/ListRequestedWorkflowStates",
    register(container) {
        container.register(ListRequestedWorkflowStatesUseCase);
    }
});
