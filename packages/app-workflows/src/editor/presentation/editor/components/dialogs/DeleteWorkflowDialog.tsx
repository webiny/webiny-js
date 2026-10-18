import React from "react";
import { EditorConfirmDialog } from "./EditorConfirmDialog.js";
import type { EditorDialogProps } from "./EditorConfirmDialog.js";

// Confirm deleting the open workflow (R278): Cancel / Delete workflow.
export const DeleteWorkflowDialog = (props: EditorDialogProps) => {
    return <EditorConfirmDialog {...props} testId="delete-workflow-dialog" />;
};
