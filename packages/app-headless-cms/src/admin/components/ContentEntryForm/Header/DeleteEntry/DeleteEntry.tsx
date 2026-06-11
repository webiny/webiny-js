import React from "react";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { usePermission } from "~/admin/hooks/index.js";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/views/ContentEntryFormPresenterProvider.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";

export const DeleteEntry = () => {
    const { vm, actions } = useContentEntryFormPresenter();
    const listPresenter = useContentEntriesPresenter();
    const { canDelete } = usePermission();

    const { OptionsMenuItem } =
        ContentEntryEditorConfig.Actions.MenuItemAction.useOptionsMenuItem();

    const deleteEntry = async () => {
        const deleted = await actions.deleteEntry();
        if (deleted) {
            listPresenter.deselectEntry();
        }
    };

    if (!vm.entry || !canDelete(vm.entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<DeleteIcon />}
            label={"Trash entry"}
            onAction={deleteEntry}
            disabled={vm.loading !== null}
            data-testid={"cms.content-form.header.delete"}
        />
    );
};
