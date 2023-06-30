import React, { useCallback } from "react";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { makeComposable } from "@webiny/react-composition";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries";
import { useRevision } from "~/admin/views/contentEntries/ContentEntry/useRevision";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import usePermission from "~/admin/hooks/usePermission";

const SaveAndPublishButtonComponent: React.FC = () => {
    const { form, loading, entry } = useContentEntry();
    const { publishRevision } = useRevision({ revision: entry });
    const { ButtonPrimary } = ContentEntryEditorConfig.Actions.useButtons();

    const { showConfirmation } = useConfirmationDialog({
        title: "Publish content",
        message: (
            <p>{"You are about to publish a new revision. Are you sure you want to continue?"}</p>
        ),
        dataTestId: "cms-confirm-save-and-publish"
    });

    const { canEdit, canPublish } = usePermission();

    const onPublishClick = useCallback(
        (ev: React.MouseEvent) => {
            showConfirmation(async () => {
                const entry = await form.current.submit(ev);
                if (!entry || !entry.id) {
                    return;
                }
                await publishRevision(entry.id);
            });
        },
        [showConfirmation]
    );

    if (!canEdit(entry, "cms.contentEntry") || !canPublish("cms.contentEntry")) {
        return null;
    }

    return (
        <ButtonPrimary
            onAction={onPublishClick}
            disabled={loading}
            data-testid="cms-content-save-publish-content-button"
        >
            {"Save & Publish"}
        </ButtonPrimary>
    );
};

export const SaveAndPublishButton = makeComposable(
    "SaveAndPublishButton",
    SaveAndPublishButtonComponent
);
