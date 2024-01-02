import React from "react";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries";
import usePermission from "~/admin/hooks/usePermission";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";

export const SaveContentButton = () => {
    const { form, entry } = useContentEntry();
    const { canEdit } = usePermission();
    const { useButtons } = ContentEntryEditorConfig.Actions.ButtonAction;
    const { ButtonSecondary } = useButtons();

    if (!canEdit(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <ButtonSecondary
            data-testid={"cms-content-save-content-button"}
            onAction={ev => {
                form.current.submit(ev, {
                    /**
                     * We are skipping the required validator on purpose, because we want to allow partial saving of the entry.
                     */
                    skipValidators: ["required"]
                });
            }}
        >
            {"Save"}
        </ButtonSecondary>
    );
};
