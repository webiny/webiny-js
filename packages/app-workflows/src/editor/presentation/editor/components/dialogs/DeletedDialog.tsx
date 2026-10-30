import React from "react";
import { EditorConfirmDialog } from "./EditorConfirmDialog.js";
import type { EditorDialogProps } from "./EditorConfirmDialog.js";

// The workflow was deleted while editing (R276, QBZ-94): Discard changes / Save as new workflow. Not dismissible.
export const DeletedDialog = (props: EditorDialogProps) => {
    return <EditorConfirmDialog {...props} testId="deleted-dialog" dismissible={false} />;
};
