import React from "react";
import { usePage } from "~/admin/views/Pages/PageDetails";
import { PreviewRevisionMenuItem } from "./PreviewRevisionMenuItem";
import { usePreviewPage } from "~/admin/hooks/usePreviewPage";
import { useRevision } from "~/admin/plugins/pageDetails/pageRevisions/RevisionsList";

interface DefaultPreviewPageProps {
    label: React.ReactNode;
    icon: React.ReactElement;
}

export const DefaultPreviewRevision = (props: DefaultPreviewPageProps) => {
    const { page } = usePage();
    const { revision } = useRevision();
    const { previewPage } = usePreviewPage({
        id: revision.id,
        status: revision.status,
        path: page.path
    });

    return <PreviewRevisionMenuItem icon={props.icon} onClick={previewPage} label={props.label} />;
};
