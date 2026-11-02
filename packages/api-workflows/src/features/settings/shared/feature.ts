import { createFeature } from "@webiny/feature/api";
import { WorkflowSettingsModelProvider } from "./WorkflowSettingsModelProvider.js";
import { WorkflowSettingsRepository } from "./WorkflowSettingsRepository.js";

export const WorkflowSettingsSharedFeature = createFeature({
    name: "Workflows/WorkflowSettingsShared",
    register(container) {
        container.register(WorkflowSettingsModelProvider);
        container.register(WorkflowSettingsRepository).inSingletonScope();
    }
});
