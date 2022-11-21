import React from "react";
import { i18n } from "@webiny/app/i18n";
import usePermission from "~/hooks/usePermission";
import { PbPageDataLink } from "~/types";
import { MenuItem } from "@webiny/ui/Menu";
import { useDeletePage } from "~/admin/views/Pages/hooks/useDeletePage";
import { LinkItem } from "@webiny/app-folders/types";

const t = i18n.ns("app-headless-cms/app-page-builder/page-details/header/delete-page");

interface DeletePageProps {
    page: PbPageDataLink;
    onDeletePageSuccess: (linkItem: LinkItem) => void;
}
const RowActionDeletePage: React.FC<DeletePageProps> = props => {
    const { page, onDeletePageSuccess } = props;
    const { canDelete } = usePermission();

    const { deletePageMutation } = useDeletePage({ page, onDeletePageSuccess });

    if (!canDelete(page)) {
        console.log("Does not have permission to delete page.");
        return null;
    }

    return <MenuItem onClick={deletePageMutation}>{t`Delete`}</MenuItem>;
};

export default RowActionDeletePage;
