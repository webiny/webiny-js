import React from "react";
import { EditorConfirmDialog } from "./EditorConfirmDialog.js";
import type { EditorDialogProps } from "./EditorConfirmDialog.js";

// Confirm removing a step from the draft (R278): Cancel / Delete step.
export const DeleteStepDialog = (props: EditorDialogProps) => {
    return <EditorConfirmDialog {...props} testId="delete-step-dialog" />;
};
