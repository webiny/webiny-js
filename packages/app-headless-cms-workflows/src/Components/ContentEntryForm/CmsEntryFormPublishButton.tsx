import { useContentEntry, usePermission } from "@webiny/app-headless-cms";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import React, { useCallback } from "react";

export const CmsEntryFormPublishButton = () => {
    const { loading, entry, publishEntryRevision } = useContentEntry();
    const { ButtonPrimary } = ContentEntryEditorConfig.Actions.ButtonAction.useButtons();

    const publish = useCallback(() => {
        if (!entry.id) {
            console.warn(`You cannot publish an entry that hasn't been saved yet.`);
            return;
        }
        publishEntryRevision({ id: entry.id });
    }, [entry.id]);

    const { canEdit, canPublish } = usePermission();

    if (entry.meta.status === "published") {
        return null;
    } else if (!canEdit(entry, "cms.contentEntry") || !canPublish("cms.contentEntry")) {
        return null;
    }

    return (
        <ButtonPrimary
            onAction={publish}
            disabled={loading}
            data-testid="workflows-cms-content-publish-content-button"
        >
            {"Publish"}
        </ButtonPrimary>
    );
};
