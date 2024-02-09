import React from "react";
import { makeComposable } from "@webiny/app-admin";
import { ReactComponent as PreviewIcon } from "~/admin/assets/visibility.svg";
import { usePage } from "~/admin/views/Pages/PageDetails";
import { PreviewPageMenuItem } from "./PreviewPage/PreviewPageMenuItem";
import { DefaultPreviewPage } from "./PreviewPage/DefaultPreviewPage";

export interface PreviewPageProps {
    icon?: React.ReactElement;
    label?: React.ReactNode;
    onClick?: () => void;
}

export const PreviewPage = makeComposable("PreviewPage", (props: PreviewPageProps) => {
    const { page } = usePage();

    const previewButtonLabel = page.status === "published" ? "View" : "Preview";

    if (!props.onClick) {
        return (
            <DefaultPreviewPage
                label={props.label ?? previewButtonLabel}
                icon={props.icon ?? <PreviewIcon />}
            />
        );
    }

    return (
        <PreviewPageMenuItem
            icon={props.icon ?? <PreviewIcon />}
            onClick={props.onClick}
            label={props.label ?? previewButtonLabel}
        />
    );
});
