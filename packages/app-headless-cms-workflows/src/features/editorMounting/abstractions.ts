import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowEditorAppAdapter } from "@webiny/app-workflows/editor/WorkflowEditorAppAdapter.js";

export const CmsWorkflowEditorAppAdapter = createAbstraction<WorkflowEditorAppAdapter>(
    "Cms/Workflows/EditorAppAdapter"
);

export namespace CmsWorkflowEditorAppAdapter {
    export type Interface = WorkflowEditorAppAdapter;
}
