import React, { ReactElement } from "react";

import { i18n } from "@webiny/app/i18n";
import { MenuItem } from "@webiny/ui/Menu";

import usePermission from "~/hooks/usePermission";
import { useDeletePage } from "~/admin/views/Pages/hooks/useDeletePage";

import { PbPageDataLink } from "~/types";

const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/actions/page/delete");

interface Props {
    page: PbPageDataLink;
}
export const PageActionDelete = ({ page }: Props): ReactElement => {
    const { canDelete } = usePermission();
    const { openDialogDeletePage } = useDeletePage({ page });

    if (!canDelete(page)) {
        console.log("Does not have permission to delete page.");
        return <></>;
    }

    return <MenuItem onClick={openDialogDeletePage}>{t`Delete`}</MenuItem>;
};
