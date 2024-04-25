import React, { useCallback } from "react";
import { useConfirmationDialog } from "@webiny/app-admin";
import { useRevision } from "~/admin/views/contentEntries/ContentEntry/useRevision";
import { useContentEntry } from "~/admin/views/contentEntries/hooks";

interface ShowConfirmationDialogParams {
    ev: React.MouseEvent;
    onAccept?: () => void;
    onCancel?: () => void;
}

interface UseSaveAndPublishResponse {
    showConfirmationDialog: (params: ShowConfirmationDialogParams) => void;
}

export const useSaveAndPublish = (): UseSaveAndPublishResponse => {
    const { form, entry } = useContentEntry();
    const { publishRevision } = useRevision({ revision: entry });

    const { showConfirmation } = useConfirmationDialog({
        title: "Publish content",
        message: <p>You are about to publish a new revision. Are you sure you want to continue?</p>,
        dataTestId: "cms-confirm-save-and-publish"
    });

    const showConfirmationDialog = useCallback(
        async ({ ev, onAccept, onCancel }) => {
            const entry = await form.current.submit(ev);
            if (!entry || !entry.id) {
                return;
            }

            showConfirmation(async () => {
                await publishRevision(entry.id);

                if (typeof onAccept === "function") {
                    await onAccept();
                }
            }, onCancel);
        },
        [showConfirmation]
    );

    return { showConfirmationDialog };
};
