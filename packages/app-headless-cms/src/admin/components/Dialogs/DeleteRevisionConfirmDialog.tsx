import React from "react";
import { ConfirmationDialog } from "@webiny/app-admin/components/ConfirmationDialog/index.js";
import { useNamedConfirmationDialog } from "@webiny/app-admin";

export const DeleteRevisionConfirmDialog = () => {
    const { onConfirm, onCancel, closeDialog } = useNamedConfirmationDialog<{
        revisionId: string;
    }>();

    return (
        <ConfirmationDialog
            title="Delete revision"
            loadingLabel="Deleting revision..."
            onConfirm={async () => {
                await onConfirm();
                closeDialog();
            }}
            onCancel={() => {
                onCancel();
                closeDialog();
            }}
        >
            <p>Are you sure you want to permanently delete this revision?</p>
        </ConfirmationDialog>
    );
};
