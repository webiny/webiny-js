import { createFeature } from "@webiny/feature/api";
import { ListRequestedWorkflowStatesUseCase } from "./ListRequestedWorkflowStatesUseCase.js";
import { ListWorkflowStatesFeature } from "../ListWorkflowStates/index.js";

export const ListRequestedWorkflowStatesFeature = createFeature({
    name: "WorkflowState/ListRequestedWorkflowStates",
    register(container) {
        // Register dependency
        ListWorkflowStatesFeature.register(container);

        // Register use case
        container.register(ListRequestedWorkflowStatesUseCase);
    }
});
