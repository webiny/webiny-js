import React from "react";
import { ReactComponent as Delete } from "@webiny/icons/delete.svg";
import { useToast } from "@webiny/admin-ui";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { useEntry, usePermission } from "~/admin/hooks/index.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/list/useContentEntriesPresenter.js";

export const DeleteEntry = () => {
    const { entry } = useEntry();
    const toast = useToast();
    const { canDelete } = usePermission();
    const presenter = useContentEntriesPresenter();
    const { OptionsMenuItem } = ContentEntryListConfig.Browser.Entry.Action;

    const handleDelete = async () => {
        const success = await presenter.deleteEntry(entry.entryId);
        if (success) {
            toast.showSuccessToast({
                title: `${entry.meta.title} was trashed successfully!`
            });
        }
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
            variant={"destructive"}
        />
    );
};
