import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowEditorAppGateway } from "./IWorkflowEditorAppGateway.js";

/*
 * One app's editor gateway. Every app registers its own class under this one token (R347):
 * `container.register(CmsWorkflowEditorGateway).inSingletonScope()` in the CMS, the WB the same,
 * so both coexist and the routing `WorkflowEditorGateway` receives them all.
 */
export const WorkflowEditorAppGateway = createAbstraction<IWorkflowEditorAppGateway>(
    "Workflows/WorkflowEditorAppGateway"
);

export namespace WorkflowEditorAppGateway {
    export type Interface = IWorkflowEditorAppGateway;
}
