import { createFeature } from "@webiny/feature/admin";
import { WbWorkflowEditorGateway } from "./WbWorkflowEditorGateway/WbWorkflowEditorGateway.js";

/*
 * Registers the Website Builder editor gateway under the shared `WorkflowEditorAppGateway` token
 * (R347, R354); the routing gateway of app-workflows picks it for `app: "wb"`. Nothing to resolve.
 */
export const WbWorkflowEditorFeature = createFeature({
    name: "WebsiteBuilderWorkflows/WorkflowEditor",
    register(container) {
        container.register(WbWorkflowEditorGateway).inSingletonScope();
    }
});
