import React, { useCallback, useState } from "react";
import { Textarea } from "@webiny/admin-ui";
import { ConfirmationDialog } from "@webiny/app-admin/components/ConfirmationDialog/index.js";
import { useNamedConfirmationDialog } from "@webiny/app-admin";

export const EditRevisionNoteDialog = () => {
    const { onConfirm, onCancel, closeDialog, params } = useNamedConfirmationDialog<
        { revisionDescription: string },
        { revisionDescription: string }
    >();

    const [description, setDescription] = useState(params.revisionDescription ?? "");

    const handleChange = useCallback((value: string) => {
        setDescription(value);
    }, []);

    return (
        <ConfirmationDialog
            title="Revision note"
            confirmLabel="Save"
            loadingLabel="Saving..."
            onConfirm={async () => {
                await onConfirm({ revisionDescription: description });
                closeDialog();
            }}
            onCancel={() => {
                onCancel();
                closeDialog();
            }}
        >
            <Textarea
                description={"Add or update the note for this revision:"}
                onChange={handleChange}
                value={description}
            />
        </ConfirmationDialog>
    );
};
