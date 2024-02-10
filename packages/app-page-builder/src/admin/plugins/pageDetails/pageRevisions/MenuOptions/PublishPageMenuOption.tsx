import React from "react";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as PublishIcon } from "~/admin/assets/round-publish-24px.svg";
import { PbPageRevision } from "~/types";
import { makeComposable } from "@webiny/app-admin";
import { useRevision } from "../RevisionsList";

export interface PublishPageMenuOptionProps {
    onClick: (revision: PbPageRevision) => void;
}

export const PublishPageMenuOption = makeComposable(
    "PublishPageMenuOption",
    (props: PublishPageMenuOptionProps) => {
        const { revision } = useRevision();

        if (revision.status === "published") {
            return null;
        }

        return (
            <MenuItem onClick={() => props.onClick(revision)}>
                <ListItemGraphic>
                    <Icon icon={<PublishIcon />} />
                </ListItemGraphic>
                Publish
            </MenuItem>
        );
    }
);
