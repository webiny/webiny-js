import React from "react";
import { EditorConfirmDialog } from "./EditorConfirmDialog.js";
import type { EditorDialogProps } from "./EditorConfirmDialog.js";

// Another admin saved a newer version (R276, D131): Keep editing / Reload workflow.
export const ConflictDialog = (props: EditorDialogProps) => {
    return <EditorConfirmDialog {...props} testId="conflict-dialog" />;
};
