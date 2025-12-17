import { createFeature } from "@webiny/feature/api";
import { ListWorkflowStatesUseCase } from "./ListWorkflowStatesUseCase.js";
import { ListWorkflowStatesRepository } from "./ListWorkflowStatesRepository.js";

export const ListWorkflowStatesFeature = createFeature({
    name: "WorkflowState/ListWorkflowStates",
    register(container) {
        container.register(ListWorkflowStatesRepository).inSingletonScope();
        container.register(ListWorkflowStatesUseCase);
    }
});
