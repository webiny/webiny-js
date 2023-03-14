import React, { ReactElement } from "react";

import { ReactComponent as Edit } from "@material-design-icons/svg/filled/edit.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";

import { ListItemGraphic } from "~/admin/components/Table/Table/styled";

const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/actions/folder/edit");

interface Props {
    onClick: () => void;
}
export const FolderActionEdit = ({ onClick }: Props): ReactElement => {
    return (
        <MenuItem onClick={onClick}>
            <ListItemGraphic>
                <Icon icon={<Edit />} />
            </ListItemGraphic>
            {t`Edit`}
        </MenuItem>
    );
};
