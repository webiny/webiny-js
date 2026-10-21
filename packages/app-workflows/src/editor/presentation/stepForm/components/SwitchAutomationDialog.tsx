import React from "react";
import { Dialog } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import type { SwitchAutomationConfirmationVm } from "../buildSwitchConfirmation.js";

export interface SwitchAutomationDialogProps {
    confirmation: SwitchAutomationConfirmationVm;
    onConfirm: () => void;
    onCancel: () => void;
}

// "Switch to “{automation}”?" (QBZ-14). The drawer presenter owns when it shows and what the buttons do.
export const SwitchAutomationDialog = createReactiveComponent(function SwitchAutomationDialog(
    props: SwitchAutomationDialogProps
) {
    const { confirmation, onConfirm, onCancel } = props;

    return (
        <Dialog
            open
            onOpenChange={open => {
                if (!open) {
                    onCancel();
                }
            }}
            title={confirmation.title}
            actions={
                <>
                    <Dialog.CancelAction text={confirmation.cancelLabel} />
                    <Dialog.ConfirmAction text={confirmation.confirmLabel} onClick={onConfirm} />
                </>
            }
        >
            <p>{confirmation.body}</p>
        </Dialog>
    );
});
