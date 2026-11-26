import React from "react";
import { Buttons, createReactiveComponent } from "@webiny/app-admin";
import { useContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/form/useContentEntryFormPresenter.js";

export const EntryFormHeaderRight = createReactiveComponent(() => {
    const presenter = useContentEntryFormPresenter();
    const { buttonActions } = useContentEntryEditorConfig();

    const { canSave, canPublish, canUnpublish, canDelete } = presenter.vm;

    if (!canSave && !canPublish && !canUnpublish && !canDelete) {
        return <div />;
    }

    return (
        <div className={"flex items-center gap-sm"}>
            <Buttons actions={buttonActions} />
        </div>
    );
});
