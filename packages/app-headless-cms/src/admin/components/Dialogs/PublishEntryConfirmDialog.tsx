import React, { useCallback, useState } from "react";
import { Text, Textarea } from "@webiny/admin-ui";
import { ConfirmationDialog } from "@webiny/app-admin/components/ConfirmationDialog/index.js";
import { useNamedConfirmationDialog } from "@webiny/app-admin";

export const PublishEntryConfirmDialog = () => {
    const { onConfirm, onCancel, closeDialog } = useNamedConfirmationDialog<
        { entryId: string },
        { revisionDescription: string }
    >();

    const [description, setDescription] = useState("");

    const handleChange = useCallback((value: string) => {
        setDescription(value);
    }, []);

    return (
        <ConfirmationDialog
            title="Publish entry"
            confirmLabel="Yes, publish!"
            loadingLabel="Publishing..."
            onConfirm={async () => {
                await onConfirm({ revisionDescription: description });
                closeDialog();
            }}
            onCancel={() => {
                onCancel();
                closeDialog();
            }}
        >
            <Text as="div" size={"md"} className={"mb-md"}>
                Are you sure you want to publish this entry?
            </Text>
            <Textarea
                description={"Write a revision description (optional):"}
                onChange={handleChange}
                value={description}
            />
        </ConfirmationDialog>
    );
};
