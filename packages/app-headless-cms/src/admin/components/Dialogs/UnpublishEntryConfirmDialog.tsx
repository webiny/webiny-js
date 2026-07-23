import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { ConfirmationDialog } from "@webiny/app-admin/components/ConfirmationDialog/index.js";
import { useNamedConfirmationDialog } from "@webiny/app-admin";

export interface UnpublishEntryConfirmDialogProps {
    /**
     * Arbitrary content rendered at the top of the dialog body. Features (e.g. the scheduler)
     * decorate this component and pass a notice here.
     */
    intro?: React.ReactNode;
}

export const UnpublishEntryConfirmDialog = makeDecoratable(
    "UnpublishEntryConfirmDialog",
    ({ intro }: UnpublishEntryConfirmDialogProps) => {
        const { onConfirm, onCancel, closeDialog } = useNamedConfirmationDialog<{
            entryId: string;
        }>();

        return (
            <ConfirmationDialog
                title="Unpublish entry"
                confirmLabel="Yes, unpublish!"
                loadingLabel="Unpublishing..."
                onConfirm={async () => {
                    await onConfirm();
                    closeDialog();
                }}
                onCancel={() => {
                    onCancel();
                    closeDialog();
                }}
            >
                {intro}
                <p>Are you sure you want to unpublish this entry?</p>
            </ConfirmationDialog>
        );
    }
);
