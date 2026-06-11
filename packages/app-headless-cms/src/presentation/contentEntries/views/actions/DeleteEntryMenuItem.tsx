import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { usePermission } from "~/admin/hooks/index.js";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { useContentEntryFormPresenter } from "../ContentEntryFormPresenterProvider.js";
import { useContentEntriesPresenter } from "../ContentEntriesPresenterProvider.js";

export const DeleteEntryMenuItem = observer(() => {
    const presenter = useContentEntryFormPresenter();
    const listPresenter = useContentEntriesPresenter();
    const { canDelete } = usePermission();

    const { OptionsMenuItem } =
        ContentEntryEditorConfig.Actions.MenuItemAction.useOptionsMenuItem();

    const deleteEntry = async () => {
        const deleted = await presenter.deleteEntry();
        if (deleted) {
            listPresenter.deselectEntry();
        }
    };

    if (!presenter.vm.entry || !canDelete(presenter.vm.entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<DeleteIcon />}
            label={"Trash entry"}
            onAction={deleteEntry}
            disabled={presenter.vm.loading !== null}
            data-testid={"cms.content-form.header.delete"}
        />
    );
});
