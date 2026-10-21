import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowEditorAppAdapter } from "@webiny/app-workflows/editor/WorkflowEditorAppAdapter.js";

export const WbWorkflowEditorAppAdapter = createAbstraction<WorkflowEditorAppAdapter>(
    "WebsiteBuilder/Workflows/EditorAppAdapter"
);

export namespace WbWorkflowEditorAppAdapter {
    export type Interface = WorkflowEditorAppAdapter;
}
