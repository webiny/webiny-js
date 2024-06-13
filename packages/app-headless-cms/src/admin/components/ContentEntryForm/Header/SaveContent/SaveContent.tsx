import React from "react";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries";
import { usePermission } from "~/admin/hooks/usePermission";
import { useContentEntryForm } from "~/admin/components/ContentEntryForm/useContentEntryForm";

export const SaveContentButton = () => {
    const { canEdit } = usePermission();
    const { useButtons } = ContentEntryEditorConfig.Actions.ButtonAction;
    const { ButtonSecondary } = useButtons();
    const { entry, saveEntry } = useContentEntryForm();

    if (!canEdit(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <ButtonSecondary
            data-testid={"cms-content-save-content-button"}
            onAction={() => saveEntry({ skipValidators: ["required"] })}
        >
            {"Save"}
        </ButtonSecondary>
    );
};
