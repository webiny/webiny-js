import React from "react";

import { OptionsMenu } from "@webiny/app-admin";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as MoreIcon } from "@material-design-icons/svg/filled/more_vert.svg";
import { Menu } from "@webiny/ui/Menu";
import { RecordActionCopy } from "../RecordActionCopy";
import { RecordActionDelete } from "../RecordActionDelete";
import { RecordActionEdit } from "../RecordActionEdit";
import { RecordActionMove } from "../RecordActionMove";
import { menuStyles } from "./Cells.styled";
import { FolderProvider, useAcoConfig } from "@webiny/app-aco";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";
import { FileProvider } from "~/contexts/FileProvider";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";

export const CellActions = () => {
    const { useTableCell, isFileItem } = FileManagerViewConfig.Browser.Table.Column;
    const { item } = useTableCell();
    const { showFileDetails } = useFileManagerView();
    const { folder: folderConfig } = useAcoConfig();

    if (isFileItem(item)) {
        return (
            <FileProvider file={item}>
                <Menu className={menuStyles} handle={<IconButton icon={<MoreIcon />} />}>
                    <RecordActionCopy record={item} />
                    <RecordActionEdit id={item.id} onClick={showFileDetails} />
                    <RecordActionMove />
                    <RecordActionDelete record={item} />
                </Menu>
            </FileProvider>
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
