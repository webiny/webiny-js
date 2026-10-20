import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowEditorAppGateway } from "@webiny/app-workflows/editor/appGateway/abstractions.js";

export const WbWorkflowEditorGateway = createAbstraction<WorkflowEditorAppGateway.Interface>(
    "WebsiteBuilder/Workflows/WorkflowEditorGateway"
);

export namespace WbWorkflowEditorGateway {
    export type Interface = WorkflowEditorAppGateway.Interface;
}
