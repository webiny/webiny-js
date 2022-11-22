import React, { ReactElement } from "react";

import { LinkItem } from "@webiny/app-folders/types";
import { i18n } from "@webiny/app/i18n";
import { MenuItem } from "@webiny/ui/Menu";

import usePermission from "~/hooks/usePermission";
import { useDeletePage } from "~/admin/views/Pages/hooks/useDeletePage";

import { PbPageDataLink } from "~/types";

const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/actions/page/delete");

interface Props {
    page: PbPageDataLink;
    onDeletePageSuccess: (linkItem: LinkItem) => void;
}
export const PageActionDelete = ({ page, onDeletePageSuccess }: Props): ReactElement => {
    const { canDelete } = usePermission();

    const { deletePageMutation } = useDeletePage({ page, onDeletePageSuccess });

    if (!canDelete(page)) {
        console.log("Does not have permission to delete page.");
        return <></>;
    }

    return <MenuItem onClick={deletePageMutation}>{t`Delete`}</MenuItem>;
};
