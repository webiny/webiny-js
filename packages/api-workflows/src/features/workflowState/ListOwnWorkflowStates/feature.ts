import { createFeature } from "@webiny/feature/api";
import { ListOwnWorkflowStatesUseCase } from "./ListOwnWorkflowStatesUseCase.js";

export const ListOwnWorkflowStatesFeature = createFeature({
    name: "WorkflowState/ListOwnWorkflowStates",
    register(container) {
        container.register(ListOwnWorkflowStatesUseCase);
    }
});
