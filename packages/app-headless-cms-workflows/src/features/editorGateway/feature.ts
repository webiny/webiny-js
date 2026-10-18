import { createFeature } from "@webiny/feature/admin";
import { CmsWorkflowEditorUseCases as UseCasesAbstraction } from "./CmsWorkflowEditorUseCases.js";
import { CmsWorkflowEditorGateway } from "./CmsWorkflowEditorGatewayImpl.js";
import { CmsWorkflowEditorUseCases } from "./CmsWorkflowEditorUseCasesImpl.js";

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
