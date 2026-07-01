import React, { useEffect, useState } from "react";
import { useRoute } from "@webiny/app-admin";
import { OverlayLoader } from "@webiny/admin-ui";
import type { EditorPage } from "@webiny/website-builder-sdk";
import { useGetPage } from "~/features/pages/index.js";
import { useGetWebsiteBuilderSettings } from "~/features/index.js";
import { Routes } from "~/routes.js";
import { PageEditorDrawerProvider } from "./Revisions/usePageEditorDrawer.js";
import { PageEditorSurface } from "./PageEditorSurface.js";
import { pageToEditorDocument } from "./pageDocument.js";
import { ExperimentsEditorProvider } from "~/presentation/experiments/ExperimentsEditorContext.js";

export const PageEditor = () => {
    const { getSettings } = useGetWebsiteBuilderSettings();
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState<EditorPage | null>(null);

    const [isRevisionListOpen, openRevisionList] = useState(false);

    const { route } = useRoute(Routes.Pages.Editor);

    const { getPage } = useGetPage();

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getSettings(),
            getPage({ id: route.params.id }).then(page => {
                setPage(pageToEditorDocument(page));
            })
        ]).then(() => {
            setLoading(false);
        });
    }, [route.params.id]);

    if (loading || !page) {
        return <OverlayLoader text={"Loading page..."} />;
    }

    return (
        <PageEditorDrawerProvider
            openRevisionList={openRevisionList}
            isRevisionListOpen={isRevisionListOpen}
        >
            <ExperimentsEditorProvider pageRevisionId={page.id}>
                <PageEditorSurface page={page} />
            </ExperimentsEditorProvider>
        </PageEditorDrawerProvider>
    );
};
