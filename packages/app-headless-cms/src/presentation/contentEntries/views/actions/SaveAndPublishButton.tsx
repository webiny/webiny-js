import React from "react";
import { observer } from "mobx-react-lite";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { usePermission } from "~/admin/hooks/usePermission.js";
import { useContentEntryFormPresenter } from "../ContentEntryFormPresenterProvider.js";

export const SaveAndPublishButton = observer(() => {
    const presenter = useContentEntryFormPresenter();
    const { ButtonPrimary } = ContentEntryEditorConfig.Actions.ButtonAction.useButtons();
    const { canEdit, canPublish } = usePermission();

    if (
        !presenter.vm.canPublish ||
        (presenter.vm.entry && !canEdit(presenter.vm.entry, "cms.contentEntry")) ||
        !canPublish("cms.contentEntry")
    ) {
        return null;
    }

    const saveAndPublish = async () => {
        const saved = await presenter.save({ skipValidation: false });
        if (!saved) {
            return;
        }
        await presenter.publish();
    };

    return (
        <ButtonPrimary
            onAction={saveAndPublish}
            disabled={presenter.vm.loading !== null}
            data-testid="cms-content-save-publish-content-button"
        >
            {"Save & Publish"}
        </ButtonPrimary>
    );
});
