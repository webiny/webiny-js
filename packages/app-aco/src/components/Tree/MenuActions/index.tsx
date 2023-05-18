import React from "react";
import { ReactComponent as Delete } from "@material-design-icons/svg/outlined/delete.svg";
import { ReactComponent as Edit } from "@material-design-icons/svg/outlined/edit.svg";
import { ReactComponent as More } from "@material-design-icons/svg/outlined/more_vert.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { Container, ListItemGraphic } from "~/components/Tree/MenuActions/styled";
import { FolderItem } from "~/types";

const t = i18n.ns("app-aco/components/tree/menu-actions");

interface Props {
    folder?: FolderItem | null;
    onUpdateFolder: (data: FolderItem) => void;
    onDeleteFolder: (data: FolderItem) => void;
}

export const MenuActions: React.VFC<Props> = ({ folder, onUpdateFolder, onDeleteFolder }) => {
    if (!folder) {
        return null;
    }
    return (
        <Container className={"folder-tree-menu-action"}>
            <Menu handle={<More />} renderToPortal={true}>
                <MenuItem onClick={() => onUpdateFolder(folder)}>
                    <ListItemGraphic>
                        <Icon icon={<Edit />} />
                    </ListItemGraphic>
                    {t`Edit`}
                </MenuItem>
                <MenuItem onClick={() => onDeleteFolder(folder)}>
                    <ListItemGraphic>
                        <Icon icon={<Delete />} />
                    </ListItemGraphic>
                    {t`Delete`}
                </MenuItem>
            </Menu>
        </Container>
    );
};
