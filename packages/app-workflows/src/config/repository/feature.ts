import { createFeature } from "@webiny/feature/admin";
import { WorkflowConfigGateway } from "~/config/gateway/WorkflowConfigGateway.js";
import { WorkflowConfigRepository } from "./WorkflowConfigRepository.js";

// The config gateway and repository, both singletons (R343, the Dashboard repository form).
export const WorkflowConfigRepositoryFeature = createFeature({
    name: "Workflows/WorkflowConfigRepository",
    register(container) {
        container.register(WorkflowConfigGateway).inSingletonScope();
        container.register(WorkflowConfigRepository).inSingletonScope();
    }
});
