import { createFeature } from "@webiny/feature/admin";
import { WbWorkflowEditorUseCases as UseCasesAbstraction } from "./WbWorkflowEditorUseCases.js";
import { WbWorkflowEditorGateway } from "./WbWorkflowEditorGatewayImpl.js";
import { WbWorkflowEditorUseCases } from "./WbWorkflowEditorUseCasesImpl.js";

export const WbWorkflowEditorFeature = createFeature({
    name: "WebsiteBuilderWorkflows/WorkflowEditor",
    register(container) {
        container.register(WbWorkflowEditorGateway).inSingletonScope();
        container.register(WbWorkflowEditorUseCases).inSingletonScope();
    },
    resolve(container) {
        return {
            useCases: container.resolve(UseCasesAbstraction)
        };
    }
});
