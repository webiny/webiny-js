import React, { useCallback, useState } from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { Text, Textarea } from "@webiny/admin-ui";
import { ConfirmationDialog } from "@webiny/app-admin/components/ConfirmationDialog/index.js";
import { useNamedConfirmationDialog } from "@webiny/app-admin";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";

/**
 * Extension slot rendered at the top of the "Publish entry" dialog body. Renders nothing by
 * default; features (e.g. the scheduler) decorate it to inject a notice about the entry being
 * published (such as a warning that a scheduled action will be cancelled).
 */
export const PublishEntryConfirmDialogExtra = makeDecoratable(
    "PublishEntryConfirmDialogExtra",
    (_props: { entry: CmsContentEntry }): React.ReactElement | null => null
);

export const PublishEntryConfirmDialog = () => {
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
            <PublishEntryConfirmDialogExtra entry={params.entry} />
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
};
