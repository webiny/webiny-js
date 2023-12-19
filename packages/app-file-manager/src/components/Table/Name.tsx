import React from "react";

import { ReactComponent as Folder } from "@material-design-icons/svg/outlined/folder.svg";
import { ReactComponent as FolderShared } from "@material-design-icons/svg/outlined/folder_shared.svg";
import { ReactComponent as Image } from "@material-design-icons/svg/outlined/insert_photo.svg";
import { ReactComponent as File } from "@material-design-icons/svg/outlined/description.svg";

import { RowIcon, RowText, RowTitle } from "./styled";

interface DefaultProps {
    name: string;
    id: string;
    onClick: (id: string) => void;
}

interface FileProps extends DefaultProps {
    type?: string;
}

interface FolderProps extends DefaultProps {
    canManagePermissions: boolean;
    hasNonInheritedPermissions: boolean;
}

export const FolderName = ({
    name,
    id,
    onClick,
    canManagePermissions,
    hasNonInheritedPermissions
}: FolderProps) => {
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

export const FileName = ({ name, id, type, onClick }: FileProps) => {
    return (
        <RowTitle onClick={() => onClick(id)}>
            <RowIcon>{type && type.includes("image") ? <Image /> : <File />}</RowIcon>
            <RowText use={"subtitle2"}>{name}</RowText>
        </RowTitle>
    );
};
