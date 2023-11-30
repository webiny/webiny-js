import React from "react";

import { FolderProvider, useAcoConfig } from "@webiny/app-aco";
import { OptionsMenu } from "@webiny/app-admin";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as MoreIcon } from "@material-design-icons/svg/filled/more_vert.svg";
import { Menu } from "@webiny/ui/Menu";

import { PageListConfig } from "~/admin/config/pages";
import { RecordActionPreview } from "~/admin/components/Table/Table/Row/Record/RecordActionPreview";
import { RecordActionPublish } from "~/admin/components/Table/Table/Row/Record/RecordActionPublish";
import { RecordActionEdit } from "~/admin/components/Table/Table/Row/Record/RecordActionEdit";
import { RecordActionMove } from "~/admin/components/Table/Table/Row/Record/RecordActionMove";
import { RecordActionDelete } from "~/admin/components/Table/Table/Row/Record/RecordActionDelete";

import { menuStyles } from "./Cells.styled";

export const CellActions = () => {
    const { useTableCell, isPbPageItem } = PageListConfig.Browser.Table.Column;
    const { item } = useTableCell();
    const { folder: folderConfig } = useAcoConfig();

    if (isPbPageItem(item)) {
        return (
            <Menu className={menuStyles} handle={<IconButton icon={<MoreIcon />} />}>
                <RecordActionEdit record={item} />
                <RecordActionPreview record={item} />
                <RecordActionPublish record={item} />
                <RecordActionMove record={item} />
                <RecordActionDelete record={item} />
            </Menu>
        );
    }

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
};
