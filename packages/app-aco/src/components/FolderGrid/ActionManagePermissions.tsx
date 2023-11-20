import React from "react";

import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";
import { ReactComponent as Security } from "@material-design-icons/svg/outlined/add_moderator.svg";

import { ListItemGraphic } from "./styled";

const t = i18n.ns("app-aco/folder-grid/action-manage-permissions");

interface ActionManagePermissionsProps {
    onClick: () => void;
}

export const ActionManagePermissions: React.VFC<ActionManagePermissionsProps> = ({ onClick }) => {
    return (
        <MenuItem onClick={onClick}>
            <ListItemGraphic>
                <Icon icon={<Security />} />
            </ListItemGraphic>
            {t`Manage Permissions`}
        </MenuItem>
    );
};
