import React from "react";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { usePermission } from "~/admin/hooks/usePermission.js";
import { useContentEntryForm } from "~/admin/components/ContentEntryForm/useContentEntryForm.js";
import { useIsModelPublishable } from "~/admin/hooks/useIsModelPublishable.js";

export const SaveContentButton = () => {
    const { useButtons } = ContentEntryEditorConfig.Actions.ButtonAction;
    const { canEdit } = usePermission();
    const { ButtonSecondary } = useButtons();
    const { entry, saveEntry } = useContentEntryForm();
    const isModelPublishable = useIsModelPublishable();

    if (!canEdit(entry, "cms.contentEntry")) {
        return null;
    }

    const skipValidators = isModelPublishable ? ["required"] : [];

    return (
        <ButtonSecondary
            data-testid={"cms-content-save-content-button"}
            onAction={() => saveEntry({ skipValidators })}
        >
            {"Save"}
        </ButtonSecondary>
    );
};
