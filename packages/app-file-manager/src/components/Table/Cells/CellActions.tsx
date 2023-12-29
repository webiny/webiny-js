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
    const { useTableRow, isFolderRow } = FileManagerViewConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const { showFileDetails } = useFileManagerView();
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
        <FileProvider file={row}>
            <Menu className={menuStyles} handle={<IconButton icon={<MoreIcon />} />}>
                <RecordActionCopy record={row} />
                <RecordActionEdit id={row.id} onClick={showFileDetails} />
                <RecordActionMove />
                <RecordActionDelete record={row} />
            </Menu>
        </FileProvider>
    );
};
