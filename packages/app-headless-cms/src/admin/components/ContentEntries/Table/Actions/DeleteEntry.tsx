import React from "react";
import { ReactComponent as Delete } from "@webiny/icons/delete.svg";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { useContentEntry, useEntry, usePermission } from "~/admin/hooks/index.js";

export const DeleteEntry = () => {
    const { entry } = useEntry();
    const contentEntry = useContentEntry();
    const { canDelete } = usePermission();
    const { OptionsMenuItem } = ContentEntryListConfig.Browser.Entry.Action;

    const deleteEntry = async () => {
        await contentEntry.deleteEntry({ id: entry.entryId });
    };

    if (!canDelete(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<Delete />}
            label={"Trash"}
            onAction={deleteEntry}
            data-testid={"aco.actions.entry.delete"}
            className={"text-destructive-primary! [&_svg]:fill-destructive"}
        />
    );
};
