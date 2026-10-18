import { createFeature } from "@webiny/feature/admin";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { CmsWorkflowEditorUseCases } from "~/features/editorGateway/CmsWorkflowEditorUseCases.js";
import { CmsWorkflowEditorAppAdapter as AdapterAbstraction } from "./CmsWorkflowEditorAppAdapter.js";
import { CmsWorkflowEditorAppAdapter } from "./CmsWorkflowEditorAppAdapterImpl.js";

export const CmsWorkflowEditorMountingFeature = createFeature({
    name: "CmsWorkflows/EditorMounting",
    register(container) {
        container.register(CmsWorkflowEditorAppAdapter).inSingletonScope();
    },
    resolve(container) {
        return {
            useCases: container.resolve(CmsWorkflowEditorUseCases),
            reviewUseCases: container.resolve(CmsReviewUseCases),
            app: container.resolve(AdapterAbstraction)
        };
    }
});
