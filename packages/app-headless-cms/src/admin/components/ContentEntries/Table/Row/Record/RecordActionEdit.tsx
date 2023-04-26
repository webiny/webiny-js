import React, { useCallback } from "react";
import { ReactComponent as Edit } from "@material-design-icons/svg/outlined/edit.svg";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { useModel, usePermission } from "~/admin/hooks";
import { RecordEntry } from "../../types";

const t = i18n.ns("app-headless-cms/admin/components/content-entries/table");

interface Props {
    record: RecordEntry;
}

export const RecordActionEdit: React.VFC<Props> = ({ record }) => {
    const { history } = useRouter();
    const { model } = useModel();
    const { canEdit } = usePermission();

    const onClick = useCallback(() => {
        console.log(record);
        return history.push(
            `/cms/content-entries/${model.modelId}/${encodeURIComponent(record.id)}`
        );
    }, [model, record]);

    if (!canEdit(record.original, "cms.contentEntry")) {
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
