import { createFeature } from "@webiny/feature/api";
import { ListOwnWorkflowStatesUseCase } from "./ListOwnWorkflowStatesUseCase.js";
import { ListWorkflowStatesFeature } from "../ListWorkflowStates/index.js";

export const ListOwnWorkflowStatesFeature = createFeature({
    name: "WorkflowState/ListOwnWorkflowStates",
    register(container) {
        // Register dependency
        ListWorkflowStatesFeature.register(container);

        // Register use case
        container.register(ListOwnWorkflowStatesUseCase);
    }
});
