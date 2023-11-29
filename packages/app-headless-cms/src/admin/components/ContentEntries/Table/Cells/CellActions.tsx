import React, { useCallback } from "react";

import { OptionsMenu } from "@webiny/app-admin";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as MoreIcon } from "@material-design-icons/svg/filled/more_vert.svg";
import { Menu } from "@webiny/ui/Menu";
import { useTableCell } from "~/admin/views/contentEntries/hooks";

import { RecordActionDelete } from "../Row/Record/RecordActionDelete";
import { RecordActionEdit } from "../Row/Record/RecordActionEdit";
import { RecordActionMove } from "../Row/Record/RecordActionMove";
import { RecordActionPublish } from "../Row/Record/RecordActionPublish";

import { menuStyles } from "./Cells.styled";
import { FolderProvider, useAcoConfig } from "@webiny/app-aco";
import { usePermission } from "~/admin/hooks";
import { CreatableItem } from "~/admin/hooks/usePermission";

export const CellActions = () => {
    const { item, isEntryItem } = useTableCell();
    const { folder: folderConfig } = useAcoConfig();
    const { canEdit: baseCanEdit } = usePermission();

    const canEdit = useCallback(
        (entry: CreatableItem) => {
            return baseCanEdit(entry, "cms.contentEntry");
        },
        [baseCanEdit]
    );

    if (isEntryItem(item)) {
        return (
            <Menu className={menuStyles} handle={<IconButton icon={<MoreIcon />} />}>
                {/*<RecordActionEdit*/}
                {/*    record={item}*/}
                {/*    onClick={() => console.log("item", item)}*/}
                {/*    canEdit={canEdit}*/}
                {/*/>*/}
                {/*<RecordActionPublish record={item} />*/}
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
