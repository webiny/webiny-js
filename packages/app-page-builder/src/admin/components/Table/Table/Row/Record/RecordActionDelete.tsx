import React, { ReactElement } from "react";

import { ReactComponent as Delete } from "@material-design-icons/svg/outlined/delete.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";

import { usePagesPermissions } from "~/hooks/permissions";
import { useDeletePage } from "~/admin/views/Pages/hooks/useDeletePage";

import { ListItemGraphic } from "~/admin/components/Table/Table/styled";
import { PbPageDataItem } from "~/types";

const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/actions/page/delete");

interface Props {
    record: PbPageDataItem;
}
export const RecordActionDelete = ({ record }: Props): ReactElement => {
    const { canDelete } = usePagesPermissions();
    const { openDialogDeletePage } = useDeletePage({ page: record });

    if (!canDelete(record?.createdBy?.id)) {
        console.log("Does not have permission to delete page.");
        return <></>;
    }

    return (
        <MenuItem onClick={openDialogDeletePage}>
            <ListItemGraphic>
                <Icon icon={<Delete />} />
            </ListItemGraphic>
            {t`Delete`}
        </MenuItem>
    );
};
