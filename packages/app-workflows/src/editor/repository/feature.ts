import { createFeature } from "@webiny/feature/admin";
import { WorkflowEditorGateway } from "~/editor/gateway/WorkflowEditorGateway.js";
import { WorkflowEditorRepository } from "./WorkflowEditorRepository.js";

// The editor's routing gateway and repository, both singletons (R344, R354); nothing to resolve.
export const WorkflowEditorRepositoryFeature = createFeature({
    name: "Workflows/WorkflowEditorRepository",
    register(container) {
        container.register(WorkflowEditorGateway).inSingletonScope();
        container.register(WorkflowEditorRepository).inSingletonScope();
    }
});
