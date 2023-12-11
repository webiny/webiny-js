import React from "react";
import { FolderProvider, useAcoConfig } from "@webiny/app-aco";
import { OptionsMenu } from "@webiny/app-admin";
import { PageListConfig } from "~/admin/config/pages";
import { PageProvider } from "~/admin/views/Pages/hooks/usePage";

export const CellActions = () => {
    const { useTableCell, isFolderItem } = PageListConfig.Browser.Table.Column;
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
        <PageProvider page={item}>
            <OptionsMenu
                actions={recordConfig.actions}
                data-testid={"table.row.pb.page.menu-action"}
            />
        </PageProvider>
    );
};
