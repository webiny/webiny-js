import React from "react";
import { FolderProvider } from "@webiny/app-aco";
import { makeDecoratable, OptionsMenu } from "@webiny/app-admin";
import { PageListConfig, usePageListConfig } from "~/modules/pages/configs/index.js";
import { PageProvider } from "~/modules/pages/PagesList/hooks/usePage.js";

const DefaultCellActions = () => {
    const { useTableRow, isFolderRow } = PageListConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const { browser } = usePageListConfig();
    const { folder: folderConfig, record: documentConfig } = browser;

    if (isFolderRow(row)) {
        // If the user cannot manage folder structure, no need to show the menu.
        if (!row.data.canManageStructure) {
            return null;
        }

        return (
            <FolderProvider folder={row.data}>
                <OptionsMenu actions={folderConfig.actions} />
            </FolderProvider>
        );
    }

    return (
        <PageProvider page={row.data}>
            <OptionsMenu actions={documentConfig.actions} />
        </PageProvider>
    );
};

export const CellActions = makeDecoratable("CellActions", DefaultCellActions);
