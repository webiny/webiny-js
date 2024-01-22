import React from "react";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as PreviewIcon } from "~/admin/assets/visibility.svg";
import { PbPageRevision } from "~/types";
import { makeComposable } from "@webiny/app-admin";

export interface PreviewRevisionMenuOptionProps {
    revision: PbPageRevision;
    previewRevision: () => void;
}

export const PageRevisionPreviewRevisionMenuOption = (props: PreviewRevisionMenuOptionProps) => {
    const { revision, previewRevision } = props;

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
