import React, { ReactElement } from "react";

import { ReactComponent as Move } from "@material-design-icons/svg/outlined/drive_file_move.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";
import { useMovePageToFolder } from "~/admin/views/Pages/hooks/useMovePageToFolder";

import { ListItemGraphic } from "~/admin/components/Table/Table/styled";

import { PageEntry } from "~/admin/components/Table/Table";

const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/actions/page/move");

interface Props {
    record: PageEntry;
}

export const RecordActionMove = ({ record }: Props): ReactElement => {
    const movePageToFolder = useMovePageToFolder({ record });

    return (
        <MenuItem onClick={movePageToFolder}>
            <ListItemGraphic>
                <Icon icon={<Move />} />
            </ListItemGraphic>
            {t`Move`}
        </MenuItem>
    );
};
