import React from "react";
import { Button } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { EditorDialogIconView } from "./EditorDialogIconView.js";
import type { WorkflowEditorDialogVm } from "~/editor/presentation/editor/abstractions.js";

export interface EditorDialogProps {
    dialog: WorkflowEditorDialogVm;
    onConfirm(): void;
    onCancel(): void;
}

export interface EditorConfirmDialogProps extends EditorDialogProps {
    testId: string;
    // False for a dialog whose buttons decide the draft: Escape and overlay do nothing.
    dismissible?: boolean;
    // Content between the body and the note (the blocked dialog's review list).
    children?: React.ReactNode;
}

/*
 * The shell of every editor dialog: title, body, optional content and note from the view model, a
 * tertiary Cancel button and an optional primary button. The dialog is open while it is mounted;
 * the presenter owns its state. It has no close button; a dismissible dialog cancels on Escape and
 * overlay; nothing closes while busy.
 */
export const EditorConfirmDialog = (props: EditorConfirmDialogProps) => {
    const { dialog, onConfirm, onCancel, testId, children } = props;
    const dismissible = props.dismissible !== false;

    let confirm: React.ReactNode = null;
    if (dialog.confirmLabel !== null) {
        let confirmVariant: "primary" | "destructive" = "primary";
        if (dialog.destructive) {
            confirmVariant = "destructive";
        }
        confirm = (
            <Button
                variant={confirmVariant}
                text={dialog.confirmLabel}
                disabled={dialog.busy}
                onClick={onConfirm}
            />
        );
    }

    let cancelVariant: "tertiary" | "destructive" = "tertiary";
    if (dialog.cancelDestructive) {
        cancelVariant = "destructive";
    }
    const actions = (
        <>
            <Button
                variant={cancelVariant}
                text={dialog.cancelLabel}
                disabled={dialog.busy}
                onClick={onCancel}
            />
            {confirm}
        </>
    );

    let note: React.ReactNode = null;
    if (dialog.note !== null) {
        note = (
            <Text size="md" data-testid="dialog-note">
                {dialog.note}
            </Text>
        );
    }

    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open && dismissible && !dialog.busy) {
                    onCancel();
                }
            }}
            title={dialog.title}
            icon={<EditorDialogIconView name={dialog.icon} />}
            dismissible={dismissible}
            showCloseButton={false}
            loading={dialog.busy}
            actions={actions}
        >
            <div data-testid={testId} className="flex flex-col gap-md">
                <Text size="md">{dialog.body}</Text>
                {children}
                {note}
            </div>
        </Dialog>
    );
};
