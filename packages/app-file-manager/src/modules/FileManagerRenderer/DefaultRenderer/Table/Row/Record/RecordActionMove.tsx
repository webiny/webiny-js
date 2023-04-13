import React, { ReactElement } from "react";

import { ReactComponent as Move } from "@material-design-icons/svg/outlined/drive_file_move.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";

import { ListItemGraphic } from "~/modules/FileManagerRenderer/DefaultRenderer/Table/styled";

const t = i18n.ns("app-admin/file-manager/file-manager-view/actions/file/move");

interface RecordActionMoveProps {
    onClick: () => void;
}
export const RecordActionMove = ({ onClick }: RecordActionMoveProps): ReactElement => {
    return (
        <MenuItem onClick={onClick}>
            <ListItemGraphic>
                <Icon icon={<Move />} />
            </ListItemGraphic>
            {t`Move`}
        </MenuItem>
    );
};
