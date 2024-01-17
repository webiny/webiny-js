import React, { useMemo } from "react";
import { ReactComponent as Delete } from "@material-design-icons/svg/outlined/delete.svg";
import { AcoConfig, useFolders } from "@webiny/app-aco";
import { usePage } from "~/admin/views/Pages/hooks/usePage";
import { useDeletePage } from "~/admin/views/Pages/hooks/useDeletePage";
import { usePagesPermissions } from "~/hooks/permissions";

export const DeletePage = () => {
    const { page } = usePage();
    const { folderLevelPermissions: flp } = useFolders();
    const { canDelete: pagesCanDelete } = usePagesPermissions();
    const { openDialogDeletePage } = useDeletePage({ page });
    const { OptionsMenuItem } = AcoConfig.Record.Action;

    const { folderId } = page.location;
    const canDelete = useMemo(() => {
        return pagesCanDelete(page.data.createdBy.id) && flp.canManageContent(folderId);
    }, [flp, folderId]);

    if (!canDelete) {
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
