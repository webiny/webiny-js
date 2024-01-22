import React, { useMemo } from "react";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as EditIcon } from "~/admin/assets/edit.svg";
import { usePagesPermissions } from "~/hooks/permissions";
import { PbPageData, PbPageRevision } from "~/types";
import { makeComposable } from "@webiny/app-admin";
import { useFolders } from "@webiny/app-aco";

export interface EditRevisionMenuOptionProps {
    page: PbPageData;
    revision: PbPageRevision;
    editRevision: () => void;
}

export const PageRevisionEditRevisionMenuOption = (props: EditRevisionMenuOptionProps) => {
    const { page, revision, editRevision } = props;
    const { canUpdate: pagesCanUpdate } = usePagesPermissions();
    const { folderLevelPermissions: flp } = useFolders();

    const hasAccess = useMemo(() => {
        return (
            pagesCanUpdate(page?.createdBy?.id) &&
            flp.canManageContent(page.wbyAco_location?.folderId)
        );
    }, [page]);

    if (!hasAccess) {
        return null;
    }

    if (revision.locked) {
        return null;
    }

    return (
        <MenuItem onClick={editRevision}>
            <ListItemGraphic>
                <Icon icon={<EditIcon />} />
            </ListItemGraphic>
            Edit
        </MenuItem>
    );
};

export const EditRevisionMenuOption = makeComposable(
    "EditRevisionMenuOption",
    PageRevisionEditRevisionMenuOption
);
