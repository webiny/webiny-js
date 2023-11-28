import React from "react";

import { ReactComponent as Folder } from "@material-design-icons/svg/outlined/folder.svg";
import { ReactComponent as FolderShared } from "@material-design-icons/svg/outlined/folder_shared.svg";
import { ReactComponent as Image } from "@material-design-icons/svg/outlined/insert_photo.svg";
import { ReactComponent as File } from "@material-design-icons/svg/outlined/description.svg";

import { useTableCell } from "~/hooks/useTableCell";

import { RowIcon, RowText, RowTitle } from "./Cells.styled";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";

interface DefaultProps {
    name: string;
    id: string;
    onClick: (id: string) => void;
}

interface FileCellNameProps extends DefaultProps {
    type?: string;
}

interface FolderCellNameProps extends DefaultProps {
    canManagePermissions: boolean;
    hasNonInheritedPermissions: boolean;
}

export const FolderCellName = ({
    name,
    id,
    onClick,
    canManagePermissions,
    hasNonInheritedPermissions
}: FolderCellNameProps) => {
    let icon = <Folder />;
    if (hasNonInheritedPermissions && canManagePermissions) {
        icon = <FolderShared />;
    }
    return (
        <RowTitle onClick={() => onClick(id)}>
            <RowIcon>{icon}</RowIcon>
            <RowText use={"subtitle2"}>{name}</RowText>
        </RowTitle>
    );
};

export const FileCellName = ({ name, id, type, onClick }: FileCellNameProps) => {
    return (
        <RowTitle onClick={() => onClick(id)}>
            <RowIcon>{type && type.includes("image") ? <Image /> : <File />}</RowIcon>
            <RowText use={"subtitle2"}>{name}</RowText>
        </RowTitle>
    );
};

export const CellName = () => {
    const { item, isFileItem } = useTableCell();
    const { showFileDetails, setFolderId } = useFileManagerView();

    if (isFileItem(item)) {
        return (
            <FileCellName
                name={item.name}
                id={item.id}
                type={item.type}
                onClick={showFileDetails}
            />
        );
    }

    return (
        <FolderCellName
            name={item.title}
            id={item.id}
            onClick={setFolderId}
            canManagePermissions={item.canManagePermissions}
            hasNonInheritedPermissions={item.hasNonInheritedPermissions}
        />
    );
};
