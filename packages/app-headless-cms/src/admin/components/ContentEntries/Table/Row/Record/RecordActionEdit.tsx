import React from "react";
import { ReactComponent as Edit } from "@material-design-icons/svg/outlined/edit.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { useContentEntriesList, usePermission } from "~/admin/hooks";
import { EntryTableItem } from "~/types";

const t = i18n.ns("app-headless-cms/admin/components/content-entries/table");

interface Props {
    record: EntryTableItem;
}

export const RecordActionEdit: React.VFC<Props> = ({ record }) => {
    const { onEditEntry } = useContentEntriesList();
    const { canEdit } = usePermission();

    if (!canEdit(record, "cms.contentEntry")) {
        return null;
    }

    return (
        <MenuItem onClick={() => onEditEntry(record)}>
            <ListItemGraphic>
                <Icon icon={<Edit />} />
            </ListItemGraphic>
            {t`Edit`}
        </MenuItem>
    );
};
