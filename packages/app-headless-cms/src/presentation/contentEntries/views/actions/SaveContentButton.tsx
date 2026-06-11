import React from "react";
import { observer } from "mobx-react-lite";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { usePermission } from "~/admin/hooks/usePermission.js";
import { useContentEntryFormPresenter } from "../ContentEntryFormPresenterProvider.js";

export const SaveContentButton = observer(() => {
    const { useButtons } = ContentEntryEditorConfig.Actions.ButtonAction;
    const { canEdit } = usePermission();
    const { ButtonSecondary } = useButtons();
    const presenter = useContentEntryFormPresenter();

    if (
        !presenter.vm.canSave ||
        (presenter.vm.entry && !canEdit(presenter.vm.entry, "cms.contentEntry"))
    ) {
        return null;
    }

    return (
        <ButtonSecondary
            data-testid={"cms-content-save-content-button"}
            onAction={() => presenter.save()}
        >
            {"Save"}
        </ButtonSecondary>
    );
});
