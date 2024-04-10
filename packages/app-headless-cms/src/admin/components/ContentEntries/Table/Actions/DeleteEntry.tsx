import React from "react";
import { ReactComponent as Delete } from "@material-design-icons/svg/outlined/delete.svg";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";
import { useDeleteEntry, useEntry, usePermission } from "~/admin/hooks";

export const DeleteEntry = () => {
    const { entry } = useEntry();
    const { canDelete } = usePermission();
    const { openDialogDeleteEntry } = useDeleteEntry({ entry });
    const { OptionsMenuItem } = ContentEntryListConfig.Browser.EntryAction;

    if (!canDelete(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<Delete />}
            label={"Trash"}
            onAction={openDialogDeleteEntry}
            data-testid={"aco.actions.entry.delete"}
        />
    );
};
