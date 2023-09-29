import React from "react";

import { ReactComponent as Delete } from "@material-design-icons/svg/outlined/delete.svg";
import { ReactComponent as Edit } from "@material-design-icons/svg/outlined/edit.svg";
import { ReactComponent as More } from "@material-design-icons/svg/outlined/more_vert.svg";
import { ReactComponent as Security } from "@material-design-icons/svg/outlined/add_moderator.svg";

import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { Menu, MenuItem } from "@webiny/ui/Menu";

import { Container, ListItemGraphic } from "./styled";

import { FolderItem } from "~/types";
import { useSecurity } from "@webiny/app-security";

const t = i18n.ns("app-aco/components/folder-tree/menu-actions");

interface MenuActionsProps {
    folder: FolderItem;
    onUpdateFolder: (data: FolderItem) => void;
    onDeleteFolder: (data: FolderItem) => void;
    onSetFolderPermissions: (data: FolderItem) => void;
}

export const MenuActions: React.VFC<MenuActionsProps> = ({
    folder,
    onUpdateFolder,
    onDeleteFolder,
    onSetFolderPermissions
}) => {
    const { identity } = useSecurity();
    const userAccessLevel = folder.permissions.find(
        p => p.target === "identity:" + identity!.id
    )?.level;

    const teamAccessLevel = folder.permissions.find(
        p => p.target === "team:todo" // TODO: replace with actual team ID
    )?.level;

    const isFolderOwner = [userAccessLevel, teamAccessLevel].filter(Boolean).includes("owner");

    if (folder) {
        return (
            <Container className={"folder-tree-menu-action"}>
                <Menu handle={<More />} renderToPortal={true}>
                    <MenuItem onClick={() => onUpdateFolder(folder)}>
                        <ListItemGraphic>
                            <Icon icon={<Edit />} />
                        </ListItemGraphic>
                        {t`Edit`}
                    </MenuItem>
                    {isFolderOwner && (
                        <MenuItem onClick={() => onSetFolderPermissions(folder)}>
                            <ListItemGraphic>
                                <Icon icon={<Security />} />
                            </ListItemGraphic>
                            {t`Manage Permissions`}
                        </MenuItem>
                    )}

                    <MenuItem onClick={() => onDeleteFolder(folder)}>
                        <ListItemGraphic>
                            <Icon icon={<Delete />} />
                        </ListItemGraphic>
                        {t`Delete`}
                    </MenuItem>
                </Menu>
            </Container>
        );
    }

    return null;
};
