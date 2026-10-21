import { createFeature } from "@webiny/feature/admin";
import { CmsWorkflowEditorGateway } from "./CmsWorkflowEditorGateway/CmsWorkflowEditorGateway.js";

/*
 * Registers the CMS editor gateway under the shared `WorkflowEditorAppGateway` token (R347, R354);
 * the routing gateway of app-workflows picks it for `app: "cms"`. Nothing to resolve.
 */
export const CmsWorkflowEditorFeature = createFeature({
    name: "CmsWorkflows/WorkflowEditor",
    register(container) {
        container.register(CmsWorkflowEditorGateway).inSingletonScope();
    }
});
