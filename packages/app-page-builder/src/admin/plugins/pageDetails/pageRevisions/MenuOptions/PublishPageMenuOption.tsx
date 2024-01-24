import React from "react";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as PublishIcon } from "~/admin/assets/round-publish-24px.svg";
import { PbPageData, PbPageRevision } from "~/types";
import { makeComposable } from "@webiny/app-admin";

export interface PublishPageMenuOptionProps {
    revision: PbPageRevision;
    page: PbPageData;
    publishRevision: (revision: PbPageRevision) => void;
}

export const PageRevisionPublishPageMenuOption = (props: PublishPageMenuOptionProps) => {
    const { revision, publishRevision } = props;

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
