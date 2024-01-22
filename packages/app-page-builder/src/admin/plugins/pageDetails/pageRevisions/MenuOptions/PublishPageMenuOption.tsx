import React, { useMemo } from "react";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as PublishIcon } from "~/admin/assets/round-publish-24px.svg";
import { usePagesPermissions } from "~/hooks/permissions";
import { PbPageData, PbPageRevision } from "~/types";
import { makeComposable } from "@webiny/app-admin";
import { useFolders } from "@webiny/app-aco";

export interface PublishPageMenuOptionProps {
    revision: PbPageRevision;
    page: PbPageData;
    publishRevision: (revision: PbPageRevision) => void;
}

export const PageRevisionPublishPageMenuOption = (props: PublishPageMenuOptionProps) => {
    const { page, revision, publishRevision } = props;
    const { canPublish: pagesCanPublish } = usePagesPermissions();
    const { folderLevelPermissions: flp } = useFolders();

    const hasAccess = useMemo(() => {
        return pagesCanPublish() && flp.canManageContent(page.wbyAco_location?.folderId);
    }, [page]);

    if (!hasAccess) {
        return null;
    }

    if (revision.status === "published") {
        return null;
    }

    return (
        <MenuItem onClick={() => publishRevision(revision)}>
            <ListItemGraphic>
                <Icon icon={<PublishIcon />} />
            </ListItemGraphic>
            Publish
        </MenuItem>
    );
};

export const PublishPageMenuOption = makeComposable(
    "PublishPageMenuOption",
    PageRevisionPublishPageMenuOption
);
