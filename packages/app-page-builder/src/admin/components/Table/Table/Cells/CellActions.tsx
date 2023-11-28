import React from "react";

import { OptionsMenu } from "@webiny/app-admin";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as MoreIcon } from "@material-design-icons/svg/filled/more_vert.svg";
import { Menu } from "@webiny/ui/Menu";
import { useTableCell } from "~/admin/hooks/useTableCell";

import { RecordActionPreview } from "~/admin/components/Table/Table/Row/Record/RecordActionPreview";
import { RecordActionPublish } from "~/admin/components/Table/Table/Row/Record/RecordActionPublish";
import { RecordActionEdit } from "~/admin/components/Table/Table/Row/Record/RecordActionEdit";
import { RecordActionMove } from "~/admin/components/Table/Table/Row/Record/RecordActionMove";
import { RecordActionDelete } from "~/admin/components/Table/Table/Row/Record/RecordActionDelete";

import { menuStyles } from "./Cells.styled";
import { FolderProvider, useAcoConfig } from "@webiny/app-aco";

export const CellActions = () => {
    const { item, isPbPageItem } = useTableCell();
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

    return (
        <FolderProvider folder={item}>
            <OptionsMenu
                actions={folderConfig.actions}
                data-testid={"table.row.folder.menu-action"}
            />
        </FolderProvider>
    );
};
