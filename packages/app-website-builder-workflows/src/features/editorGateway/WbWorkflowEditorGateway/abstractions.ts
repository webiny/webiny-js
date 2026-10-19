import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowEditorGateway } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";

export const WbWorkflowEditorGateway = createAbstraction<IWorkflowEditorGateway>(
    "WebsiteBuilder/Workflows/WorkflowEditorGateway"
);

export namespace WbWorkflowEditorGateway {
    export type Interface = IWorkflowEditorGateway;
}
