import { createFeature } from "@webiny/feature/api";
import { WorkflowAiToolRegistryService } from "./WorkflowAiToolRegistryService.js";

export const WorkflowAiToolRegistryFeature = createFeature({
    name: "Workflows/WorkflowAiToolRegistry",
    register(container) {
        container.register(WorkflowAiToolRegistryService).inSingletonScope();
    }
});
