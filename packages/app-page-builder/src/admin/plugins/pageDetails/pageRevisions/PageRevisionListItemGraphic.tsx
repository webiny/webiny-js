import React from "react";
import { css } from "emotion";
import { Icon } from "@webiny/ui/Icon";
import { ListItemGraphic } from "@webiny/ui/List";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as LockIcon } from "~/admin/assets/lock.svg";
import { ReactComponent as BeenHereIcon } from "~/admin/assets/beenhere.svg";
import { ReactComponent as GestureIcon } from "~/admin/assets/gesture.svg";
import { PbPageRevision } from "~/types";
import { makeComposable } from "@webiny/app-admin";
import { useRevision } from "~/admin/plugins/pageDetails/pageRevisions/RevisionsList";

const primaryColor = css({ color: "var(--mdc-theme-primary)" });

const getIcon = (rev: PbPageRevision) => {
    const published = rev.status === "published";
    switch (true) {
        case rev.locked && !published:
            return {
                icon: <Icon icon={<LockIcon />} />,
                text: "This revision is locked (it has already been published)"
            };
        case published:
            return {
                icon: <Icon icon={<BeenHereIcon />} className={primaryColor} />,
                text: "This revision is currently published!"
            };
        default:
            return {
                icon: <Icon icon={<GestureIcon />} />,
                text: "This is a draft"
            };
    }
};

const RevisionListItemGraphic = () => {
    const { revision } = useRevision();
    const { icon, text } = getIcon(revision);
    return (
        <ListItemGraphic>
            <Tooltip content={text} placement={"bottom"}>
                {icon}
            </Tooltip>
        </ListItemGraphic>
    );
};

export const PageRevisionListItemGraphic = makeComposable(
    "PageRevisionListItemGraphic",
    RevisionListItemGraphic
);
