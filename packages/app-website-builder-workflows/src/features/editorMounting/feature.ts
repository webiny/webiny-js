import { createFeature } from "@webiny/feature/admin";
import { ListFoldersGqlGateway } from "@webiny/app-aco/features/folders/listFolders/ListFoldersGqlGateway.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { WbWorkflowEditorUseCases } from "~/features/editorGateway/WbWorkflowEditorUseCases.js";
import { WbWorkflowEditorAppAdapter as AdapterAbstraction } from "./WbWorkflowEditorAppAdapter.js";
import { WbWorkflowEditorAppAdapter } from "./WbWorkflowEditorAppAdapterImpl.js";

export const WbWorkflowEditorMountingFeature = createFeature({
    name: "WebsiteBuilderWorkflows/EditorMounting",
    register(container) {
        // The adapter lists the page folders through app-aco's gateway (R292). The CMS registers
        // the same implementation; the last registration wins and they are alike.
        container.register(ListFoldersGqlGateway);
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
