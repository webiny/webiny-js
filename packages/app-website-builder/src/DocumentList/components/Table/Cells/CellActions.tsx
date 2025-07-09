import React from "react";
import { FolderProvider, useAcoConfig } from "@webiny/app-aco";
import { makeDecoratable, OptionsMenu } from "@webiny/app-admin";
import { PageListConfig } from "~/configs/index.js";
import { DocumentProvider } from "~/DocumentList/hooks/useDocument.js";

const DefaultCellActions = () => {
    const { useTableRow, isFolderRow } = PageListConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const { folder: folderConfig, record: documentConfig } = useAcoConfig();

    if (isFolderRow(row)) {
        // If the user cannot manage folder structure, no need to show the menu.
        if (!row.data.canManageStructure) {
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
        <DocumentProvider document={row}>
            <OptionsMenu
                actions={documentConfig.actions}
                data-testid={"table.row.wb.document.menu-action"}
            />
        </DocumentProvider>
    );
};

export const CellActions = makeDecoratable("CellActions", DefaultCellActions);
