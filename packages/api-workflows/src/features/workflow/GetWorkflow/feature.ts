import { createFeature } from "@webiny/feature/api";
import { GetWorkflowUseCase } from "./GetWorkflowUseCase.js";
import { GetWorkflowRepository } from "./GetWorkflowRepository.js";

export const GetWorkflowFeature = createFeature({
    name: "Workflows/GetWorkflow",
    register(container) {
        container.register(GetWorkflowRepository).inSingletonScope();
        container.register(GetWorkflowUseCase);
    }
});
