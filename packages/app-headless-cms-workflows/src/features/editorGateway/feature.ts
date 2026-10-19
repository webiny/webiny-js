import { createFeature } from "@webiny/feature/admin";
import { CmsWorkflowEditorUseCases as UseCasesAbstraction } from "./CmsWorkflowEditorUseCases/abstractions.js";
import { CmsWorkflowEditorGateway } from "./CmsWorkflowEditorGateway/CmsWorkflowEditorGateway.js";
import { CmsWorkflowEditorUseCases } from "./CmsWorkflowEditorUseCases/CmsWorkflowEditorUseCases.js";

export const CmsWorkflowEditorFeature = createFeature({
    name: "CmsWorkflows/WorkflowEditor",
    register(container) {
        container.register(CmsWorkflowEditorGateway).inSingletonScope();
        container.register(CmsWorkflowEditorUseCases).inSingletonScope();
    },
    resolve(container) {
        return {
            useCases: container.resolve(UseCasesAbstraction)
        };
    }
});
