import React from "react";
import { ReactComponent as Delete } from "@webiny/icons/delete.svg";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { useCms, useEntry, useModel, usePermission } from "~/admin/hooks/index.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";

export const DeleteEntry = () => {
    const { entry } = useEntry();
    const { model } = useModel();
    const { deleteEntry } = useCms();
    const { canDelete } = usePermission();
    const { actions } = useContentEntriesPresenter();
    const { OptionsMenuItem } = ContentEntryListConfig.Browser.Entry.Action;

    const handleDelete = async () => {
        await deleteEntry({ model, id: entry.entryId });
        await actions.refresh();
    };

    if (!canDelete(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<Delete />}
            label={"Trash"}
            onAction={handleDelete}
            data-testid={"aco.actions.entry.delete"}
            className={"text-destructive-primary! [&_svg]:fill-destructive"}
        />
    );
};
