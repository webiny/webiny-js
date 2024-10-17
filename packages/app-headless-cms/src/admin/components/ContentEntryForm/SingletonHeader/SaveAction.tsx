import React from "react";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries";
import { useContentEntryForm } from "~/admin/components/ContentEntryForm/useContentEntryForm";

const { Actions } = ContentEntryEditorConfig;

export const SaveAction = () => {
    const { useButtons } = Actions.ButtonAction;
    const { ButtonPrimary } = useButtons();
    const { saveEntry } = useContentEntryForm();

    return (
        <ButtonPrimary data-testid={"cms-content-save-content-button"} onAction={saveEntry}>
            Save
        </ButtonPrimary>
    );
};
