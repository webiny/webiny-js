import React from "react";
import { usePage } from "~/admin/views/Pages/PageDetails";
import { PreviewPageMenuItem } from "./PreviewPageMenuItem";
import { usePreviewPage } from "~/admin/hooks/usePreviewPage";

interface DefaultPreviewPageProps {
    label: React.ReactNode;
    icon: React.ReactElement;
}

export const DefaultPreviewPage = (props: DefaultPreviewPageProps) => {
    const { page } = usePage();
    const { previewPage } = usePreviewPage({
        id: page.id,
        status: page.status,
        path: page.path
    });

    return <PreviewPageMenuItem icon={props.icon} onClick={previewPage} label={props.label} />;
};
