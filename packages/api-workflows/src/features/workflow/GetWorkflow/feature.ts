import { createFeature } from "@webiny/feature/api";
import { GetWorkflowUseCase } from "./GetWorkflowUseCase.js";

export const GetWorkflowFeature = createFeature({
    name: "Workflows/GetWorkflow",
    register(container) {
        container.register(GetWorkflowUseCase);
    }
});
