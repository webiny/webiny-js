import React from "react";

import { makeDecoratable } from "@webiny/react-composition";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import usePermission from "~/admin/hooks/usePermission";
import { useSaveAndPublish } from "./useSaveAndPublish";

const SaveAndPublishButtonComponent = () => {
    const { loading, entry } = useContentEntry();
    const { showConfirmationDialog } = useSaveAndPublish();
    const { ButtonPrimary } = ContentEntryEditorConfig.Actions.ButtonAction.useButtons();

    const { canEdit, canPublish } = usePermission();

    if (!canEdit(entry, "cms.contentEntry") || !canPublish("cms.contentEntry")) {
        return null;
    }

    return (
        <ButtonPrimary
            onAction={showConfirmationDialog}
            disabled={loading}
            data-testid="cms-content-save-publish-content-button"
        >
            {"Save & Publish"}
        </ButtonPrimary>
    );
};

export const SaveAndPublishButton = makeDecoratable(
    "SaveAndPublishButton",
    SaveAndPublishButtonComponent
);
