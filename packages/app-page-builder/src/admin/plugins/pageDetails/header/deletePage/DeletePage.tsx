import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as DeleteIcon } from "~/admin/assets/delete.svg";
import usePermission from "~/hooks/usePermission";
import { PbPageData } from "~/types";
import { useDeletePage } from "~/admin/views/Pages/hooks/useDeletePage";

interface DeletePageProps {
    page: PbPageData;
    onDelete?: () => void;
}
const DeletePage: React.FC<DeletePageProps> = props => {
    const { page, onDelete } = props;
    const { canDelete } = usePermission();
    const { openDialogDeletePage } = useDeletePage({ page, onDelete });

    if (!canDelete(page)) {
        return null;
    }

    return (
        <Tooltip content={"Delete Page"} placement={"top"}>
            <IconButton
                icon={<DeleteIcon />}
                onClick={openDialogDeletePage}
                data-testid={"pb-page-details-header-delete-button"}
            />
        </Tooltip>
    );
};

export default DeletePage;
