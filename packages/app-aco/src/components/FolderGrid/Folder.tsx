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
import { useSecurity } from "@webiny/app-security";

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

    const { identity } = useSecurity();

    console.log(folder)
    // If we have at least one permission that is not inherited, we mark the folder as having permissions.
    const folderHasPermissions = useMemo(() => {
        return folder?.permissions?.some(p => !p.inheritedFrom);
    }, [folder?.permissions]);

    // If we have at least one permission that is not inherited, we mark the folder as having permissions.
    const canManagePermissions = useMemo(() => {
        const userAccessLevel = folder?.permissions.find(
            p => p.target === "user:" + identity!.id
        )?.level;

        const teamAccessLevel = folder?.permissions.find(
            p => p.target === "team:todo" // TODO: replace with actual team ID
        )?.level;

        return [userAccessLevel, teamAccessLevel].filter(Boolean).includes("owner");
    }, [folderHasPermissions]);

    let icon = <FolderIcon />;
    if (folderHasPermissions && canManagePermissions) {
        icon = <FolderSharedIcon />;
    }

    console.log(
        "folderHasPermissions",
        folderHasPermissions,
        "canManagePermissions",
        canManagePermissions
    );

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
