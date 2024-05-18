import React from "react";

import { ContentEntryEditorConfig } from "~/admin/config/contentEntries";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import usePermission from "~/admin/hooks/usePermission";
import { useContentEntryForm } from "~/admin/components/ContentEntryForm/useContentEntryForm";

export const SaveAndPublishButton = () => {
    const { loading, entry, publishEntryRevision } = useContentEntry();
    const { saveEntry } = useContentEntryForm();
    const { ButtonPrimary } = ContentEntryEditorConfig.Actions.ButtonAction.useButtons();

    const saveAndPublish = async () => {
        const entry = await saveEntry();
        if (!entry || !entry.id) {
            return;
        }
        await publishEntryRevision({ id: entry.id });
    };

    const { canEdit, canPublish } = usePermission();

    if (!canEdit(entry, "cms.contentEntry") || !canPublish("cms.contentEntry")) {
        return null;
    }

    return (
        <ButtonPrimary
            onAction={saveAndPublish}
            disabled={loading}
            data-testid="cms-content-save-publish-content-button"
        >
            {"Save & Publish"}
        </ButtonPrimary>
    );
};
