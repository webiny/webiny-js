import React, { useMemo } from "react";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as UnpublishIcon } from "~/admin/assets/unpublish.svg";
import { usePagesPermissions } from "~/hooks/permissions";
import { PbPageData, PbPageRevision } from "~/types";
import { makeComposable } from "@webiny/app-admin";
import { useFolders } from "@webiny/app-aco";

export interface UnpublishPageMenuOptionProps {
    page: PbPageData;
    revision: PbPageRevision;
    unpublishRevision: (revision: PbPageRevision) => void;
}

export const PageRevisionUnpublishPageMenuOption = (props: UnpublishPageMenuOptionProps) => {
    const { page, revision, unpublishRevision } = props;
    const { canUnpublish: pagesCanUnpublish } = usePagesPermissions();
    const { folderLevelPermissions: flp } = useFolders();

    const hasAccess = useMemo(() => {
        return pagesCanUnpublish() && flp.canManageContent(page.wbyAco_location?.folderId);
    }, [page]);

    if (!hasAccess) {
        return null;
    }

    if (revision.status !== "published") {
        return null;
    }

    return (
        <MenuItem onClick={() => unpublishRevision(revision)}>
            <ListItemGraphic>
                <Icon icon={<UnpublishIcon />} />
            </ListItemGraphic>
            Unpublish
        </MenuItem>
    );
};

export const UnpublishPageMenuOption = makeComposable(
    "UnpublishPageMenuOption",
    PageRevisionUnpublishPageMenuOption
);
