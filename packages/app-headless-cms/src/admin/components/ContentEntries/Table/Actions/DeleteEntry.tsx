import React from "react";
import { ReactComponent as Delete } from "@material-design-icons/svg/outlined/delete.svg";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";
import { useContentEntry, useEntry, usePermission } from "~/admin/hooks";

export const DeleteEntry = () => {
    const { entry } = useEntry();
    const contentEntry = useContentEntry();
    const { canDelete } = usePermission();
    const { OptionsMenuItem } = ContentEntryListConfig.Browser.EntryAction;

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
        />
    );
};
