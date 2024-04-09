import React from "react";
import { FolderProvider, useAcoConfig } from "@webiny/app-aco";
import { OptionsMenu } from "@webiny/app-admin";
import { PageListConfig } from "~/admin/config/pages";
import { PageProvider } from "~/admin/contexts/Page";
import { PbPageTableItem } from "~/types";

export const CellActions = () => {
    const { useTableRow, isFolderRow } = PageListConfig.Browser.Table.Column;
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
        <PageProvider<PbPageTableItem> page={row}>
            <OptionsMenu
                actions={recordConfig.actions}
                data-testid={"table.row.pb.page.menu-action"}
            />
        </PageProvider>
    );
};
