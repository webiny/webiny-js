import React from "react";

import { ReactComponent as MoreIcon } from "@material-design-icons/svg/filled/more_vert.svg";
import { FolderProvider, useAcoConfig } from "@webiny/app-aco";
import { OptionsMenu } from "@webiny/app-admin";
import { IconButton } from "@webiny/ui/Button";
import { Menu } from "@webiny/ui/Menu";

import { ContentEntryListConfig } from "~/admin/config/contentEntries";

import { RecordActionDelete } from "../Row/Record/RecordActionDelete";
import { RecordActionEdit } from "../Row/Record/RecordActionEdit";
import { RecordActionMove } from "../Row/Record/RecordActionMove";
import { RecordActionPublish } from "../Row/Record/RecordActionPublish";

import { menuStyles } from "./Cells.styled";

export const CellActions = () => {
    const { useTableCell, isFolderItem } = ContentEntryListConfig.Browser.Table.Column;
    const { item } = useTableCell();
    const { folder: folderConfig } = useAcoConfig();

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
        <Menu className={menuStyles} handle={<IconButton icon={<MoreIcon />} />}>
            <RecordActionEdit record={item} />
            <RecordActionPublish record={item} />
            <RecordActionMove record={item} />
            <RecordActionDelete record={item} />
        </Menu>
    );
};
