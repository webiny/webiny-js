import React from "react";
import { FolderProvider } from "@webiny/app-aco";
import { makeDecoratable, OptionsMenu } from "@webiny/app-admin";
import {
    ContentEntryListConfig,
    useContentEntryListConfig
} from "~/admin/config/contentEntries/index.js";
import { EntryProvider } from "~/admin/hooks/useEntry.js";

const DefaultCellActions = () => {
    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const { browser } = useContentEntryListConfig();

    if (isFolderRow(row)) {
        // If the user cannot manage folder structure, no need to show the menu.
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
        <EntryProvider entry={row.data}>
            <OptionsMenu
                actions={browser.entry.actions}
                data-testid={"table.row.pb.entry.menu-action"}
            />
        </EntryProvider>
    );
};

export const CellActions = makeDecoratable("CellActions", DefaultCellActions);
