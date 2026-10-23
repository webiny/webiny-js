import React from "react";
import type { WorkflowEditorDialogKind } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowEditorDialogVm } from "~/editor/presentation/editor/abstractions.js";
import { BlockedDeleteDialog } from "./BlockedDeleteDialog.js";
import { ConflictDialog } from "./ConflictDialog.js";
import { DeleteStepDialog } from "./DeleteStepDialog.js";
import { DeleteWorkflowDialog } from "./DeleteWorkflowDialog.js";
import { DeletedDialog } from "./DeletedDialog.js";
import { DiscardChangesDialog } from "./DiscardChangesDialog.js";
import type { EditorDialogProps } from "./EditorConfirmDialog.js";
import { ReloadWorkflowDialog } from "./ReloadWorkflowDialog.js";

export interface WorkflowEditorDialogsProps {
    dialog: WorkflowEditorDialogVm | null;
    onConfirm(): void;
    onCancel(): void;
}

const DIALOGS: Record<WorkflowEditorDialogKind, React.ComponentType<EditorDialogProps>> = {
    discardChanges: DiscardChangesDialog,
    conflict: ConflictDialog,
    deleted: DeletedDialog,
    deleteWorkflow: DeleteWorkflowDialog,
    blockedDelete: BlockedDeleteDialog,
    deleteStep: DeleteStepDialog,
    reloadWorkflow: ReloadWorkflowDialog
};

// Mounts the dialog component of the presenter's `vm.dialog` kind, or nothing.
export const WorkflowEditorDialogs = ({
    dialog,
    onConfirm,
    onCancel
}: WorkflowEditorDialogsProps) => {
    if (dialog === null) {
        return null;
    }

    const Dialog = DIALOGS[dialog.kind];
    return <Dialog dialog={dialog} onConfirm={onConfirm} onCancel={onCancel} />;
};
