import React from "react";
import { ReactComponent as Delete } from "@material-design-icons/svg/outlined/delete.svg";
import { PageListConfig } from "~/admin/config/pages";
import { usePage } from "~/admin/views/Pages/hooks/usePage";
import { useDeletePage } from "~/admin/views/Pages/hooks/useDeletePage";
import { usePagesPermissions } from "~/hooks/permissions";

export const DeletePage = () => {
    const { page } = usePage();
    const { canDelete } = usePagesPermissions();
    const { openDialogDeletePage } = useDeletePage({ page });
    const { OptionsMenuItem } = PageListConfig.Browser.PageAction;

    if (!canDelete(page.data.createdBy.id)) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<Delete />}
            label={"Delete"}
            onAction={openDialogDeletePage}
            data-testid={"aco.actions.pb.page.delete"}
        />
    );
};
