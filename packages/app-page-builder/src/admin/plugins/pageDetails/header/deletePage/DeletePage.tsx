import React, {useMemo} from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as DeleteIcon } from "~/admin/assets/delete.svg";
import { usePagesPermissions } from "~/hooks/permissions";
import { PbPageData } from "~/types";
import { useDeletePage } from "~/admin/views/Pages/hooks/useDeletePage";
import {useFolders} from "@webiny/app-aco";

interface DeletePageProps {
    page: PbPageData;
    onDelete?: () => void;
}
const DeletePage = (props: DeletePageProps) => {
    const { page, onDelete } = props;
    const { folderLevelPermissions: flp } = useFolders();
    const { canDelete:pagesCanDelete } = usePagesPermissions();
    const { openDialogDeletePage } = useDeletePage({ page, onDelete });

    const folderId = page.wbyAco_location?.folderId;

    const canDelete = useMemo(() => {
        return pagesCanDelete(page.createdBy?.id) && flp.canManageContent(folderId);
    }, [flp, folderId]);

    if (!canDelete) {
        return null;
    }

    return (
        <Tooltip content={"Delete "} placement={"top"}>
            <IconButton
                icon={<DeleteIcon />}
                onClick={openDialogDeletePage}
                data-testid={"pb-page-details-header-delete-button"}
            />
        </Tooltip>
    );
};

export default DeletePage;
