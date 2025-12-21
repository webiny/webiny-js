import { createFeature } from "@webiny/feature/api";
import { ListWorkflowsUseCase } from "./ListWorkflowsUseCase.js";
import { ListWorkflowsRepository } from "./ListWorkflowsRepository.js";

export const ListWorkflowsFeature = createFeature({
    name: "Workflows/ListWorkflows",
    register(container) {
        container.register(ListWorkflowsRepository).inSingletonScope();
        container.register(ListWorkflowsUseCase);
    }
});
