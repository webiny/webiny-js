import React, { ReactElement } from "react";

import { ReactComponent as Move } from "@material-design-icons/svg/filled/drive_file_move.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";

import { ListItemGraphic } from "~/admin/components/Table/Table/styled";

const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/actions/page/move");

interface Props {
    onClick: () => void;
}
export const RecordActionMove = ({ onClick }: Props): ReactElement => {
    return (
        <MenuItem onClick={onClick}>
            {" "}
            <ListItemGraphic>
                <Icon icon={<Move />} />
            </ListItemGraphic>
            {t`Move`}
        </MenuItem>
    );
};
