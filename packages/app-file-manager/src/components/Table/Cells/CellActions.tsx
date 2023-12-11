import React from "react";
import { OptionsMenu } from "@webiny/app-admin";
import { FolderProvider, useAcoConfig } from "@webiny/app-aco";
import { FileProvider } from "~/contexts/FileProvider";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";

export const CellActions = () => {
    const { useTableCell, isFolderItem } = FileManagerViewConfig.Browser.Table.Column;
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
        <FileProvider file={item}>
            <OptionsMenu
                actions={recordConfig.actions}
                data-testid={"table.row.file.menu-action"}
            />
        </FileProvider>
    );
};
