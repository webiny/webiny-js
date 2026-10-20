import { createFeature } from "@webiny/feature/admin";
import { ListFoldersGqlGateway } from "@webiny/app-aco/features/folders/listFolders/ListFoldersGqlGateway.js";
import { CmsWorkflowEditorAppAdapter as AdapterAbstraction } from "./abstractions.js";
import { CmsWorkflowEditorAppAdapter } from "./CmsWorkflowEditorAppAdapter.js";

/*
 * Resolves only the app adapter: the mounting component renders in the plugin pass, where nothing
 * may resolve a use case (R349, R354).
 */
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
            app: container.resolve(AdapterAbstraction)
        };
    }
});
