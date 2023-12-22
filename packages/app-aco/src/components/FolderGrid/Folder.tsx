import React from "react";

import { ReactComponent as FolderIcon } from "@material-design-icons/svg/outlined/folder.svg";
import { ReactComponent as FolderSharedIcon } from "@material-design-icons/svg/outlined/folder_shared.svg";
import { OptionsMenu } from "@webiny/app-admin";

import { useFolder } from "~/hooks";
import { useAcoConfig } from "~/config";

import { FolderContainer, FolderContent, Text } from "./styled";

export interface FolderProps {
    onClick: (id: string) => void;
}

export const Folder = ({ onClick }: FolderProps) => {
    const { folder } = useFolder();
    const { folder: folderConfig } = useAcoConfig();
    const { id, title, hasNonInheritedPermissions, canManagePermissions, canManageStructure } =
        folder;

    let icon = <FolderIcon />;
    if (hasNonInheritedPermissions && canManagePermissions) {
        icon = <FolderSharedIcon />;
    }

    return (
        <FolderContainer>
            <FolderContent onClick={() => onClick(id)}>
                <div>{icon}</div>
                <Text use={"subtitle2"}>{title}</Text>
            </FolderContent>
            {canManageStructure && (
                <OptionsMenu
                    actions={folderConfig.actions}
                    data-testid={"folder.grid.menu-action"}
                />
            )}
        </FolderContainer>
    );
};
