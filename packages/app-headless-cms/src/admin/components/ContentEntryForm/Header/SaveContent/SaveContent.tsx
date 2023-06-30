import React from "react";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries";
import usePermission from "~/admin/hooks/usePermission";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";

export const SaveContentButton: React.FC = () => {
    const { form, entry } = useContentEntry();
    const { canEdit } = usePermission();
    const { ButtonSecondary } = ContentEntryEditorConfig.Actions.useButtons();

    if (!canEdit(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <ButtonSecondary
            data-testid={"cms-content-save-content-button"}
            onAction={ev => {
                form.current.submit(ev);
            }}
        >
            {"Save"}
        </ButtonSecondary>
    );
};
