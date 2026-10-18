import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowEditorGateway } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";

export const CmsWorkflowEditorGateway = createAbstraction<IWorkflowEditorGateway>(
    "Cms/Workflows/WorkflowEditorGateway"
);

export namespace CmsWorkflowEditorGateway {
    export type Interface = IWorkflowEditorGateway;
}
