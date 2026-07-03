import React from "react";
import { ConfirmationDialog } from "@webiny/app-admin/components/ConfirmationDialog/index.js";
import { useNamedConfirmationDialog } from "@webiny/app-admin";

export const UnpublishEntryConfirmDialog = () => {
    const { onConfirm, onCancel, closeDialog } = useNamedConfirmationDialog<{ entryId: string }>();

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
            <p>Are you sure you want to unpublish this entry?</p>
        </ConfirmationDialog>
    );
};
