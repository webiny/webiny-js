import React from "react";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { usePermission } from "~/admin/hooks/usePermission.js";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/views/ContentEntryFormPresenterProvider.js";

export const SaveContentButton = () => {
    const { useButtons } = ContentEntryEditorConfig.Actions.ButtonAction;
    const { canEdit } = usePermission();
    const { ButtonSecondary } = useButtons();
    const { vm, actions } = useContentEntryFormPresenter();

    if (!vm.canSave || (vm.entry && !canEdit(vm.entry, "cms.contentEntry"))) {
        return null;
    }

    return (
        <ButtonSecondary
            data-testid={"cms-content-save-content-button"}
            onAction={() => actions.save()}
        >
            {"Save"}
        </ButtonSecondary>
    );
};
