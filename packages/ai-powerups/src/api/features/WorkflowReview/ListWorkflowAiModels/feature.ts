import { createFeature } from "@webiny/feature/api";
import { ListWorkflowAiModelsUseCase } from "./ListWorkflowAiModelsUseCase.js";

export const ListWorkflowAiModelsFeature = createFeature({
    name: "AiPowerUps/ListWorkflowAiModels",
    register(container) {
        container.register(ListWorkflowAiModelsUseCase);
    }
});
