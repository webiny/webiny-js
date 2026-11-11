import React from "react";
import { EditorConfirmDialog } from "./EditorConfirmDialog.js";
import type { EditorDialogProps } from "./EditorConfirmDialog.js";

// Reload the model's existing workflow after a duplicate-model error (R276, QBZ-18): Keep editing / Reload.
export const ReloadWorkflowDialog = (props: EditorDialogProps) => {
    return <EditorConfirmDialog {...props} testId="reload-workflow-dialog" />;
};
