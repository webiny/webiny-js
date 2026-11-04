import { createFeature } from "@webiny/feature/api";
import { ListWorkflowStepTypesUseCase } from "./ListWorkflowStepTypesUseCase.js";

export const ListWorkflowStepTypesFeature = createFeature({
    name: "Workflows/ListWorkflowStepTypes",
    register(container) {
        container.register(ListWorkflowStepTypesUseCase);
    }
});
