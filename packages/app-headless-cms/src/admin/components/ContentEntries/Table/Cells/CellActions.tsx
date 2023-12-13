import React from "react";
import { FolderProvider, useAcoConfig } from "@webiny/app-aco";
import { OptionsMenu } from "@webiny/app-admin";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";
import { EntryProvider } from "~/admin/hooks/useEntry";

export const CellActions = () => {
    const { useTableCell, isFolderItem } = ContentEntryListConfig.Browser.Table.Column;
    const { item } = useTableCell();
    const { folder: folderConfig, record: recordConfig } = useAcoConfig();

    if (isFolderItem(item)) {
        // If the user cannot manage folder structure, no need to show the menu.
        if (!item.canManageStructure) {
            return null;
        }

        return (
            <FolderProvider folder={item}>
                <OptionsMenu
                    actions={folderConfig.actions}
                    data-testid={"table.row.folder.menu-action"}
                />
            </FolderProvider>
        );
    }

    return (
        <EntryProvider entry={item}>
            <OptionsMenu
                actions={recordConfig.actions}
                data-testid={"table.row.pb.entry.menu-action"}
            />
        </EntryProvider>
    );
};
