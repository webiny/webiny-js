import { createFeature } from "@webiny/feature/admin";
import { ListFoldersGqlGateway } from "@webiny/app-aco/features/folders/listFolders/ListFoldersGqlGateway.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { CmsWorkflowEditorUseCases } from "~/features/editorGateway/CmsWorkflowEditorUseCases.js";
import { CmsWorkflowEditorAppAdapter as AdapterAbstraction } from "./CmsWorkflowEditorAppAdapter.js";
import { CmsWorkflowEditorAppAdapter } from "./CmsWorkflowEditorAppAdapterImpl.js";

export const CmsWorkflowEditorMountingFeature = createFeature({
    name: "CmsWorkflows/EditorMounting",
    register(container) {
        // The adapter lists the model's folders through app-aco's gateway (R292). The Website
        // Builder registers the same implementation; the last registration wins and they are alike.
        container.register(ListFoldersGqlGateway);
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
