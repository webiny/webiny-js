import React from "react";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries";
import { usePermission } from "~/admin/hooks/usePermission";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import { useSave } from "./useSave";

export const SaveContentButton = () => {
    const { entry } = useContentEntry();
    const { canEdit } = usePermission();
    const { useButtons } = ContentEntryEditorConfig.Actions.ButtonAction;
    const { ButtonSecondary } = useButtons();

    const { saveEntry } = useSave();

    if (!canEdit(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <ButtonSecondary data-testid={"cms-content-save-content-button"} onAction={saveEntry}>
            {"Save"}
        </ButtonSecondary>
    );
};
