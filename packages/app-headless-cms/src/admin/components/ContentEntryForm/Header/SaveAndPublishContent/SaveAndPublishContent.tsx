import React from "react";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { usePermission } from "~/admin/hooks/usePermission.js";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/views/ContentEntryFormPresenterProvider.js";

export const SaveAndPublishButton = () => {
    const { vm, actions } = useContentEntryFormPresenter();
    const { ButtonPrimary } = ContentEntryEditorConfig.Actions.ButtonAction.useButtons();
    const { canEdit, canPublish } = usePermission();

    if ((vm.entry && !canEdit(vm.entry, "cms.contentEntry")) || !canPublish("cms.contentEntry")) {
        return null;
    }

    const saveAndPublish = async () => {
        const saved = await actions.save();
        if (!saved) {
            return;
        }
        await actions.publish();
    };

    return (
        <ButtonPrimary
            onAction={saveAndPublish}
            disabled={vm.loading !== null}
            data-testid="cms-content-save-publish-content-button"
        >
            {"Save & Publish"}
        </ButtonPrimary>
    );
};
