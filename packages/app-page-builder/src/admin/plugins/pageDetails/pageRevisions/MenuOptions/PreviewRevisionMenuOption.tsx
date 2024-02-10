import React from "react";
import { ReactComponent as PreviewIcon } from "~/admin/assets/visibility.svg";
import { makeComposable } from "@webiny/app-admin";
import { useRevision } from "~/admin/plugins/pageDetails/pageRevisions/RevisionsList";
import { DefaultPreviewRevision } from "./PreviewRevision/DefaultPreviewRevision";
import { PreviewRevisionMenuItem } from "./PreviewRevision/PreviewRevisionMenuItem";

export interface PreviewRevisionProps {
    icon?: React.ReactElement;
    label?: React.ReactNode;
    onClick?: () => void;
}

export const PreviewRevisionMenuOption = makeComposable(
    "PreviewRevisionMenuOption",
    (props: PreviewRevisionProps) => {
        const { revision } = useRevision();

        const previewButtonLabel = revision.status === "published" ? "View" : "Preview";

        if (!props.onClick) {
            return (
                <DefaultPreviewRevision
                    label={props.label ?? previewButtonLabel}
                    icon={props.icon ?? <PreviewIcon />}
                />
            );
        }

        return (
            <PreviewRevisionMenuItem
                icon={props.icon ?? <PreviewIcon />}
                onClick={props.onClick}
                label={props.label ?? previewButtonLabel}
            />
        );
    }
);
