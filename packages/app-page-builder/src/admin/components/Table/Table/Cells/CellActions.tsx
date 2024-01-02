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
    const { useTableRow, isFolderRow } = PageListConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const { folder: folderConfig } = useAcoConfig();

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
        <Menu className={menuStyles} handle={<IconButton icon={<MoreIcon />} />}>
            <RecordActionEdit record={row} />
            <RecordActionPreview record={row} />
            <RecordActionPublish record={row} />
            <RecordActionMove record={row} />
            <RecordActionDelete record={row} />
        </Menu>
    );
};
