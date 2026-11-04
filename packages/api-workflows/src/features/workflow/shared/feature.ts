import { createFeature } from "@webiny/feature/api";
import { WorkflowModelProvider } from "./WorkflowModelProvider.js";
import { WorkflowRepository } from "./WorkflowRepository.js";

export const WorkflowSharedFeature = createFeature({
    name: "Workflows/WorkflowShared",
    register(container) {
        container.register(WorkflowModelProvider);
        container.register(WorkflowRepository).inSingletonScope();
    }
});
