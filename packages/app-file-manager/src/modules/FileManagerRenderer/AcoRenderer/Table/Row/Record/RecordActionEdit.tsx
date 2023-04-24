import React, { ReactElement } from "react";

import { ReactComponent as Edit } from "@material-design-icons/svg/outlined/edit.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";

import { ListItemGraphic } from "~/modules/FileManagerRenderer/DefaultRenderer/Table/styled";

const t = i18n.ns("app-admin/file-manager/file-manager-view/actions/file/edit");

interface RecordActionEditProps {
    id: string;
    onClick: (id: string) => void;
}

export const RecordActionEdit = ({ id, onClick }: RecordActionEditProps): ReactElement => {
    return (
        <MenuItem onClick={() => onClick(id)}>
            <ListItemGraphic>
                <Icon icon={<Edit />} />
            </ListItemGraphic>
            {t`Edit`}
        </MenuItem>
    );
};
