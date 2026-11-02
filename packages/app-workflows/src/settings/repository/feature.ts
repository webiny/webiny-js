import { createFeature } from "@webiny/feature/admin";
import { WorkflowSettingsGateway } from "~/settings/gateway/WorkflowSettingsGateway.js";
import { WorkflowSettingsRepository } from "./WorkflowSettingsRepository.js";

// The settings area's gateway and repository, both singletons (R343, R354).
export const WorkflowSettingsRepositoryFeature = createFeature({
    name: "Workflows/WorkflowSettingsRepository",
    register(container) {
        container.register(WorkflowSettingsGateway).inSingletonScope();
        container.register(WorkflowSettingsRepository).inSingletonScope();
    }
});
