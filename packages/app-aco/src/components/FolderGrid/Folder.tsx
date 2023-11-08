import React from "react";

import { ReactComponent as FolderIcon } from "@material-design-icons/svg/outlined/folder.svg";
import { ReactComponent as FolderSharedIcon } from "@material-design-icons/svg/outlined/folder_shared.svg";
import { OptionsMenu } from "@webiny/app-admin";

import { useFolder } from "~/hooks";
import { useAcoListConfig } from "~/config";

import { FolderContainer, FolderContent, Text } from "./styled";

export interface FolderProps {
    onClick: (id: string) => void;
}

export const Folder: React.VFC<FolderProps> = ({ onClick }) => {
    const { folder } = useFolder();
    const { folder: folderConfig } = useAcoListConfig();
    const { id, title, hasNonInheritedPermissions, canManagePermissions } = folder;

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
            <OptionsMenu actions={folderConfig.actions} data-testid={"folder.grid.menu-action"} />
        </FolderContainer>
    );
};
