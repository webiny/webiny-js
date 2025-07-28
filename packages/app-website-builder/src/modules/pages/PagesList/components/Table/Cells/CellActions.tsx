import React from "react";
import { FolderProvider, useAcoConfig } from "@webiny/app-aco";
import { makeDecoratable, OptionsMenu } from "@webiny/app-admin";
import { PageListConfig } from "~/configs/index.js";
import { DocumentProvider } from "~/modules/pages/PagesList/hooks/useDocument.js";
import type { FolderItem } from "@webiny/app-aco/types.js";

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
            <FolderProvider folder={row.data as FolderItem}>
                <OptionsMenu actions={folderConfig.actions} />
            </FolderProvider>
        );
    }

    return (
        <DocumentProvider document={row}>
            <OptionsMenu actions={documentConfig.actions} />
        </DocumentProvider>
    );
};

export const CellActions = makeDecoratable("CellActions", DefaultCellActions);
