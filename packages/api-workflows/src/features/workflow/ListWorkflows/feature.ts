import { createFeature } from "@webiny/feature/api";
import { ListWorkflowsUseCase } from "./ListWorkflowsUseCase.js";

export const ListWorkflowsFeature = createFeature({
    name: "Workflows/ListWorkflows",
    register(container) {
        container.register(ListWorkflowsUseCase);
    }
});
