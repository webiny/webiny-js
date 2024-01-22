import React, { useMemo } from "react";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as PreviewIcon } from "~/admin/assets/visibility.svg";
import { usePagesPermissions } from "~/hooks/permissions";
import { PbPageData, PbPageRevision } from "~/types";
import { makeComposable } from "@webiny/app-admin";
import { useFolders } from "@webiny/app-aco";

export interface PreviewRevisionMenuOptionProps {
    page: PbPageData;
    revision: PbPageRevision;
    previewRevision: () => void;
}

export const PageRevisionPreviewRevisionMenuOption = (props: PreviewRevisionMenuOptionProps) => {
    const { page, revision, previewRevision } = props;
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

    const previewButtonLabel = revision.status === "published" ? "View" : "Preview";

    return (
        <MenuItem onClick={previewRevision}>
            <ListItemGraphic>
                <Icon icon={<PreviewIcon />} />
            </ListItemGraphic>
            {previewButtonLabel}
        </MenuItem>
    );
};

export const PreviewRevisionMenuOption = makeComposable(
    "PreviewRevisionMenuOption",
    PageRevisionPreviewRevisionMenuOption
);
