import React from "react";
import { observer } from "mobx-react-lite";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { usePermission } from "~/admin/hooks/usePermission.js";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/form/useContentEntryFormPresenter.js";

export const PublishOnlyButton = observer(() => {
    const presenter = useContentEntryFormPresenter();
    const { ButtonPrimary } = ContentEntryEditorConfig.Actions.ButtonAction.useButtons();
    const { canPublish } = usePermission();

    if (
        !presenter.vm.canPublish ||
        presenter.vm.isDirty ||
        presenter.vm.status !== "unpublished" ||
        !canPublish("cms.contentEntry")
    ) {
        return null;
    }

    const publish = async () => {
        await presenter.publishRevision();
    };

    return (
        <ButtonPrimary
            onAction={publish}
            disabled={presenter.vm.loading !== null}
            data-testid="cms-content-publish-content-button"
        >
            {"Publish"}
        </ButtonPrimary>
    );
});
