import { createFeature } from "@webiny/feature/admin";
import { ListFoldersGqlGateway } from "@webiny/app-aco/features/folders/listFolders/ListFoldersGqlGateway.js";
import { WbWorkflowEditorAppAdapter as AdapterAbstraction } from "./abstractions.js";
import { WbWorkflowEditorAppAdapter } from "./WbWorkflowEditorAppAdapter.js";

/*
 * Resolves only the app adapter: the mounting component renders in the plugin pass, where nothing
 * may resolve a use case (R349, R354).
 */
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
            app: container.resolve(AdapterAbstraction)
        };
    }
});
