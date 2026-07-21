import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { ConfirmationDialog } from "@webiny/app-admin/components/ConfirmationDialog/index.js";
import { useNamedConfirmationDialog } from "@webiny/app-admin";

/**
 * Extension slot rendered at the top of the "Unpublish entry" dialog body. Renders nothing by
 * default; features (e.g. the scheduler) decorate it to inject a notice about the entry being
 * unpublished (such as a warning that a scheduled action will be cancelled).
 */
export const UnpublishEntryConfirmDialogExtra = makeDecoratable(
    "UnpublishEntryConfirmDialogExtra",
    (_props: { entryId: string }): React.ReactElement | null => null
);

export const UnpublishEntryConfirmDialog = () => {
    const { onConfirm, onCancel, closeDialog, params } = useNamedConfirmationDialog<{
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
            <UnpublishEntryConfirmDialogExtra entryId={params.entryId} />
            <p>Are you sure you want to unpublish this entry?</p>
        </ConfirmationDialog>
    );
};
