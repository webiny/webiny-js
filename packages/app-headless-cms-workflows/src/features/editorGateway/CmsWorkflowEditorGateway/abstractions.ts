import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowEditorAppGateway } from "@webiny/app-workflows/editor/appGateway/abstractions.js";

export const CmsWorkflowEditorGateway = createAbstraction<WorkflowEditorAppGateway.Interface>(
    "Cms/Workflows/WorkflowEditorGateway"
);

export namespace CmsWorkflowEditorGateway {
    export type Interface = WorkflowEditorAppGateway.Interface;
}
