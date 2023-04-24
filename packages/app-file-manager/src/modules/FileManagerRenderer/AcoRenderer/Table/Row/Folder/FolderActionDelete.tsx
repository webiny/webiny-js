import React, { ReactElement } from "react";

import { ReactComponent as Delete } from "@material-design-icons/svg/outlined/delete.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";

import { ListItemGraphic } from "../../styled";
const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/actions/folder/delete");

interface Props {
    onClick: () => void;
}
export const FolderActionDelete = ({ onClick }: Props): ReactElement => {
    return (
        <MenuItem onClick={onClick}>
            <ListItemGraphic>
                <Icon icon={<Delete />} />
            </ListItemGraphic>
            {t`Delete`}
        </MenuItem>
    );
};
