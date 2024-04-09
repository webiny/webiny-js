import React from "react";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as UnpublishIcon } from "~/admin/assets/unpublish.svg";
import { PbPageData, PbPageRevision } from "~/types";
import { makeDecoratable } from "@webiny/app-admin";

export interface UnpublishPageMenuOptionProps {
    page: PbPageData;
    revision: PbPageRevision;
    unpublishRevision: (revision: PbPageRevision) => void;
}

export const PageRevisionUnpublishPageMenuOption = (props: UnpublishPageMenuOptionProps) => {
    const { revision, unpublishRevision } = props;

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

export const UnpublishPageMenuOption = makeDecoratable(
    "UnpublishPageMenuOption",
    PageRevisionUnpublishPageMenuOption
);
