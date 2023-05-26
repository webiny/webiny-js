import React from "react";
import { ReactComponent as Edit } from "@material-design-icons/svg/outlined/edit.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { RecordEntry } from "../../types";
import { CreatableItem } from "~/admin/hooks/usePermission";

const t = i18n.ns("app-headless-cms/admin/components/content-entries/table");

interface Props {
    canEdit: (params: CreatableItem) => boolean;
    onClick?: () => void;
    record: RecordEntry;
}

export const RecordActionEdit: React.VFC<Props> = ({ record, onClick, canEdit }) => {
    if (!canEdit(record.original)) {
        return null;
    }

    return (
        <MenuItem onClick={onClick}>
            <ListItemGraphic>
                <Icon icon={<Edit />} />
            </ListItemGraphic>
            {t`Edit`}
        </MenuItem>
    );
};
