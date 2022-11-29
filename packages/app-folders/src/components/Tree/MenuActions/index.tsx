import React from "react";

import { ReactComponent as More } from "@material-design-icons/svg/filled/more_vert.svg";
import { i18n } from "@webiny/app/i18n";
import { Menu, MenuItem } from "@webiny/ui/Menu";

import { Container } from "~/components/Tree/MenuActions/styled";

import { FolderItem } from "~/types";

const t = i18n.ns("app-folders/components/tree/menu-actions");

interface Props {
    folder: FolderItem;
    onUpdateFolder: (data: FolderItem) => void;
    onDeleteFolder: (data: FolderItem) => void;
}

export const MenuActions = ({ folder, onUpdateFolder, onDeleteFolder }: Props) => {
    if (folder) {
        return (
            <Container className={"folder-tree-menu-action"}>
                <Menu handle={<More />} renderToPortal={true}>
                    <MenuItem onClick={() => onUpdateFolder(folder)}> {t`Edit`}</MenuItem>
                    <MenuItem onClick={() => onDeleteFolder(folder)}> {t`Delete`}</MenuItem>
                </Menu>
            </Container>
        );
    }

    return null;
};
