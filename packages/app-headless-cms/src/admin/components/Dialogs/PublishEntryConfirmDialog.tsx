import React, { useCallback, useState } from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { Text, Textarea } from "@webiny/admin-ui";
import { ConfirmationDialog } from "@webiny/app-admin/components/ConfirmationDialog/index.js";
import { useNamedConfirmationDialog } from "@webiny/app-admin";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";

export interface PublishEntryConfirmDialogProps {
    /**
     * Arbitrary content rendered at the top of the dialog body. Features (e.g. the scheduler)
     * decorate this component and pass a notice here.
     */
    beforeContent?: React.ReactNode;
}

export const PublishEntryConfirmDialog = makeDecoratable(
    "PublishEntryConfirmDialog",
    ({ beforeContent }: PublishEntryConfirmDialogProps) => {
        const { onConfirm, onCancel, closeDialog, params } = useNamedConfirmationDialog<
            { entry: CmsContentEntry },
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
                {beforeContent}
                <Text as={"div"} size={"md"} className={"mb-md"}>
                    You are about to publish a record titled{" "}
                    <span className={"font-bold"}>{params.entry.meta.title}</span>.<br />
                    Are you sure you want to continue?
                </Text>
                <Textarea
                    description={"Write a revision description (optional):"}
                    onChange={handleChange}
                    value={description}
                />
            </ConfirmationDialog>
        );
    }
);
