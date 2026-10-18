import { createFeature } from "@webiny/feature/admin";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { WbWorkflowEditorUseCases } from "~/features/editorGateway/WbWorkflowEditorUseCases.js";
import { WbWorkflowEditorAppAdapter as AdapterAbstraction } from "./WbWorkflowEditorAppAdapter.js";
import { WbWorkflowEditorAppAdapter } from "./WbWorkflowEditorAppAdapterImpl.js";

export const WbWorkflowEditorMountingFeature = createFeature({
    name: "WebsiteBuilderWorkflows/EditorMounting",
    register(container) {
        container.register(WbWorkflowEditorAppAdapter).inSingletonScope();
    },
    resolve(container) {
        return {
            useCases: container.resolve(WbWorkflowEditorUseCases),
            reviewUseCases: container.resolve(WbReviewUseCases),
            app: container.resolve(AdapterAbstraction)
        };
    }
});
