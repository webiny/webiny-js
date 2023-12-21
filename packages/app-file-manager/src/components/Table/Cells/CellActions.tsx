import React from "react";
import { OptionsMenu } from "@webiny/app-admin";
import { FolderProvider, useAcoConfig } from "@webiny/app-aco";
import { FileProvider } from "~/contexts/FileProvider";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";

export const CellActions = () => {
    const { useTableRow, isFolderRow } = FileManagerViewConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const { folder: folderConfig, record: recordConfig } = useAcoConfig();

    if (isFolderRow(row)) {
        // If the user cannot manage folder structure, no need to show the menu.
        if (!row.canManageStructure) {
            return null;
        }

        return (
            <FolderProvider folder={row}>
                <OptionsMenu
                    actions={folderConfig.actions}
                    data-testid={"table.row.folder.menu-action"}
                />
            </FolderProvider>
        );
    }

    return (
        <FileProvider file={row}>
            <OptionsMenu
                actions={recordConfig.actions}
                data-testid={"table.row.file.menu-action"}
            />
        </FileProvider>
    );
};
