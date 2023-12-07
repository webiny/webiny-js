import React from "react";
import { ReactComponent as Security } from "@material-design-icons/svg/outlined/add_moderator.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";

const t = i18n.ns("app-headless-cms/admin/components/content-entries/table");

interface Props {
    onClick: () => void;
}
export const FolderActionManagePermissions = ({ onClick }: Props) => {
    return (
        <MenuItem onClick={onClick}>
            <ListItemGraphic>
                <Icon icon={<Security />} />
            </ListItemGraphic>
            {t`ManagePermissions`}
        </MenuItem>
    );
};
