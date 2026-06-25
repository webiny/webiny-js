import React from "react";
import { ConfirmationDialog } from "@webiny/app-admin/components/ConfirmationDialog/index.js";
import { useNamedConfirmationDialog } from "@webiny/app-admin";

export const TrashEntryConfirmDialog = () => {
    const { onConfirm, onCancel, closeDialog } = useNamedConfirmationDialog<{ entryId: string }>();

    return (
        <ConfirmationDialog
            title="Trash entry"
            loadingLabel="Moving to trash..."
            onConfirm={async () => {
                await onConfirm();
                closeDialog();
            }}
            onCancel={() => {
                onCancel();
                closeDialog();
            }}
        >
            <p>
                Are you sure you want to move this entry to trash? This action will include all of
                the revisions.
            </p>
        </ConfirmationDialog>
    );
};
