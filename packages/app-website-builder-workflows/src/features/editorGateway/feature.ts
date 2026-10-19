import { createFeature } from "@webiny/feature/admin";
import { WbWorkflowEditorUseCases as UseCasesAbstraction } from "./WbWorkflowEditorUseCases/abstractions.js";
import { WbWorkflowEditorGateway } from "./WbWorkflowEditorGateway/WbWorkflowEditorGateway.js";
import { WbWorkflowEditorUseCases } from "./WbWorkflowEditorUseCases/WbWorkflowEditorUseCases.js";

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
