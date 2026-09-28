import React from "react";
import { ConfirmationDialog } from "@webiny/app-admin/components/ConfirmationDialog/index.js";
import { useNamedConfirmationDialog } from "@webiny/app-admin";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";

export const DuplicateEntryConfirmDialog = () => {
    const { onConfirm, onCancel, closeDialog, params } = useNamedConfirmationDialog<{
        entry: CmsContentEntry;
    }>();

    return (
        <ConfirmationDialog
            title="Duplicate entry"
            confirmLabel="Yes, duplicate!"
            loadingLabel="Duplicating..."
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
                You are about to duplicate <strong>{params.entry.meta.title}</strong>. The copy will
                be created as a new draft entry. Are you sure you want to continue?
            </p>
        </ConfirmationDialog>
    );
};
