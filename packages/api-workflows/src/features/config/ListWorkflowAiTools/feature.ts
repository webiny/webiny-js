import { createFeature } from "@webiny/feature/api";
import { ListWorkflowAiToolsUseCase } from "./ListWorkflowAiToolsUseCase.js";

export const ListWorkflowAiToolsFeature = createFeature({
    name: "Workflows/ListWorkflowAiTools",
    register(container) {
        container.register(ListWorkflowAiToolsUseCase);
    }
});
