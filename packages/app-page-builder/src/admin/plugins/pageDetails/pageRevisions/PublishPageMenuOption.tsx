import React from "react";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as PublishIcon } from "~/admin/assets/round-publish-24px.svg";
import usePermission from "~/hooks/usePermission";
import { PbPageRevision } from "~/types";
import { makeComposable } from "@webiny/app-admin";

export interface PublishPageMenuOptionProps {
    revision: PbPageRevision;
    publishRevision: (revision: PbPageRevision) => void;
}

export const PageRevisionPublishPageMenuOption: React.FC<PublishPageMenuOptionProps> = props => {
    const { revision, publishRevision } = props;
    const { canPublish } = usePermission();

    if (revision.status !== "published" && canPublish()) {
        return (
            <MenuItem onClick={() => publishRevision(revision)}>
                <ListItemGraphic>
                    <Icon icon={<PublishIcon />} />
                </ListItemGraphic>
                Publish
            </MenuItem>
        );
    }

    return null;
};

export const PublishPageMenuOption = makeComposable(
    "PublishPageMenuOption",
    PageRevisionPublishPageMenuOption
);
