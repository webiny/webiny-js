import React, { useMemo } from "react";
import { MenuDivider, MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as DeleteIcon } from "~/admin/assets/delete.svg";
import { usePagesPermissions } from "~/hooks/permissions";
import { PbPageData } from "~/types";
import { makeComposable } from "@webiny/app-admin";
import { useFolders } from "@webiny/app-aco";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";

export interface DeleteRevisionMenuOptionProps {
    page: PbPageData;
    deleteRevision: () => void;
}

export const PageRevisionDeleteRevisionMenuOption = (props: DeleteRevisionMenuOptionProps) => {
    const { page, deleteRevision } = props;
    const { canDelete: pagesCanDelete } = usePagesPermissions();
    const { folderLevelPermissions: flp } = useFolders();

    const hasAccess = useMemo(() => {
        return (
            pagesCanDelete(page?.createdBy?.id) &&
            flp.canManageContent(page.wbyAco_location?.folderId)
        );
    }, [page]);

    if (!hasAccess) {
        return null;
    }

    return (
        <ConfirmationDialog
            title="Confirmation required!"
            message={<span>Are you sure you want to delete this revision?</span>}
        >
            {({ showConfirmation }) => (
                <>
                    <MenuDivider />
                    <MenuItem onClick={() => showConfirmation(deleteRevision)}>
                        <ListItemGraphic>
                            <Icon icon={<DeleteIcon />} />
                        </ListItemGraphic>
                        Delete Revision
                    </MenuItem>
                </>
            )}
        </ConfirmationDialog>
    );
};

export const DeleteRevisionMenuOption = makeComposable(
    "DeleteRevisionMenuOption",
    PageRevisionDeleteRevisionMenuOption
);
