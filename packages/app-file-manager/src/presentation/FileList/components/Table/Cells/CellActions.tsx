import React from "react";
import { OptionsMenu } from "@webiny/app-admin";
import { FolderProvider } from "@webiny/app-aco";
import { FileProvider } from "~/presentation/contexts/FileProvider.js";
import { FileManagerViewConfig, useFileManagerConfig } from "~/presentation/config/FileManagerViewConfig.js";

export const CellActions = () => {
    const { useTableRow, isFolderRow } = FileManagerViewConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const { browser } = useFileManagerConfig();

    if (isFolderRow(row)) {
        if (!row.data.canManageStructure) {
            return null;
        }

        return (
            <FolderProvider folder={row.data}>
                <OptionsMenu
                    actions={browser.folder.actions}
                    data-testid={"table.row.folder.menu-action"}
                />
            </FolderProvider>
        );
    }

    return (
        <FileProvider file={row.data}>
            <OptionsMenu
                actions={browser.file.actions}
                data-testid={"table.row.file.menu-action"}
            />
        </FileProvider>
    );
};
