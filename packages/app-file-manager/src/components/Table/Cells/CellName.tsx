import React from "react";

import { ReactComponent as Folder } from "@material-design-icons/svg/outlined/folder.svg";
import { ReactComponent as FolderShared } from "@material-design-icons/svg/outlined/folder_shared.svg";
import { ReactComponent as Image } from "@material-design-icons/svg/outlined/insert_photo.svg";
import { ReactComponent as File } from "@material-design-icons/svg/outlined/description.svg";

import { RowIcon, RowText, RowTitle } from "./Cells.styled";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";
import { FileTableItem } from "~/types";
import { FolderTableItem } from "@webiny/app-aco/types";

interface DefaultProps {
    onClick: (id: string) => void;
}

interface FolderCellNameProps extends DefaultProps {
    folder: FolderTableItem;
}

export const FolderCellName = ({ folder, onClick }: FolderCellNameProps) => {
    let icon = <Folder />;
    if (folder.hasNonInheritedPermissions && folder.canManagePermissions) {
        icon = <FolderShared />;
    }

    return (
        <RowTitle onClick={() => onClick(folder.id)}>
            <RowIcon>{icon}</RowIcon>
            <RowText use={"subtitle2"}>{folder.title}</RowText>
        </RowTitle>
    );
};

interface FileCellNameProps extends DefaultProps {
    file: FileTableItem;
}

export const FileCellName = ({ file, onClick }: FileCellNameProps) => {
    return (
        <RowTitle onClick={() => onClick(file.id)}>
            <RowIcon>{file.type && file.type.includes("image") ? <Image /> : <File />}</RowIcon>
            <RowText use={"subtitle2"}>{file.name}</RowText>
        </RowTitle>
    );
};

export const CellName = () => {
    const { useTableRow, isFolderRow } = FileManagerViewConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const { showFileDetails, setFolderId } = useFileManagerView();

    if (isFolderRow(row)) {
        return <FolderCellName folder={row} onClick={setFolderId} />;
    }

    return <FileCellName file={row} onClick={showFileDetails} />;
};
