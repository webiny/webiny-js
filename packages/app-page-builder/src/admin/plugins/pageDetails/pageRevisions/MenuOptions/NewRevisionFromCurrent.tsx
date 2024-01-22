import React, { useMemo } from "react";
import { usePagesPermissions } from "~/hooks/permissions";
import { PbPageData } from "~/types";
import { makeComposable } from "@webiny/app-admin";
import { useFolders } from "@webiny/app-aco";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as AddIcon } from "~/admin/assets/add.svg";

export interface NewRevisionFromCurrentProps {
    page: PbPageData;
    createRevision: () => Promise<void>;
}

export const PageRevisionNewRevisionFromCurrent = (props: NewRevisionFromCurrentProps) => {
    const { page, createRevision } = props;
    const { canCreate: pagesCanCreate } = usePagesPermissions();
    const { folderLevelPermissions: flp } = useFolders();

    const hasAccess = useMemo(() => {
        return pagesCanCreate() && flp.canManageContent(page.wbyAco_location?.folderId);
    }, [page]);

    if (!hasAccess) {
        return null;
    }

    return (
        <MenuItem onClick={createRevision}>
            <ListItemGraphic>
                <Icon icon={<AddIcon />} />
            </ListItemGraphic>
            New from current
        </MenuItem>
    );
};

export const NewRevisionFromCurrent = makeComposable(
    "NewRevisionFromCurrent",
    PageRevisionNewRevisionFromCurrent
);
