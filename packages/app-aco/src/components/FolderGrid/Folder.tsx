import React, { useMemo } from "react";

import { ReactComponent as FolderIcon } from "@material-design-icons/svg/outlined/folder.svg";
import { ReactComponent as MoreIcon } from "@material-design-icons/svg/filled/more_vert.svg";
import { ReactComponent as FolderSharedIcon } from "@material-design-icons/svg/outlined/folder_shared.svg";

import { IconButton } from "@webiny/ui/Button";
import { ActionEdit } from "./ActionEdit";
import { ActionDelete } from "./ActionDelete";
import { ActionManagePermissions } from "./ActionManagePermissions";

import { Actions, FolderContainer, FolderContent, Text } from "./styled";
import { FolderItem } from "~/types";

export interface FolderProps {
    folder: FolderItem;
    onFolderClick: (id: string) => void;
    onMenuEditClick: (folder: FolderItem) => void;
    onMenuDeleteClick: (folder: FolderItem) => void;
    onMenuManagePermissionsClick: (folder: FolderItem) => void;
}

export const Folder: React.VFC<FolderProps> = ({
    folder,
    onFolderClick,
    onMenuEditClick,
    onMenuDeleteClick,
    onMenuManagePermissionsClick
}) => {
    const { id, title } = folder;

    const { hasNonInheritedPermissions, canManagePermissions } = folder;

    let icon = <FolderIcon />;
    if (hasNonInheritedPermissions && canManagePermissions) {
        icon = <FolderSharedIcon />;
    }

    return (
        <FolderContainer>
            <FolderContent onClick={() => onFolderClick(id)}>
                <div>{icon}</div>
                <Text use={"subtitle2"}>{title}</Text>
            </FolderContent>
            <Actions handle={<IconButton icon={<MoreIcon />} />}>
                <ActionEdit onClick={() => onMenuEditClick(folder)} />
                <ActionDelete onClick={() => onMenuDeleteClick(folder)} />
                {canManagePermissions && (
                    <ActionManagePermissions onClick={() => onMenuManagePermissionsClick(folder)} />
                )}
            </Actions>
        </FolderContainer>
    );
};
