import React from "react";
import { EditorConfirmDialog } from "./EditorConfirmDialog.js";
import type { EditorDialogProps } from "./EditorConfirmDialog.js";

// Switching the model with a dirty draft (R279): Keep editing / Discard changes.
export const DiscardChangesDialog = (props: EditorDialogProps) => {
    return <EditorConfirmDialog {...props} testId="discard-changes-dialog" />;
};
