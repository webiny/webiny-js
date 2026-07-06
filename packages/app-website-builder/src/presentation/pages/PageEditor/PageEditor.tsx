import React, { useEffect, useState } from "react";
import { useRoute } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { OverlayLoader } from "@webiny/admin-ui";
import type { EditorPage } from "@webiny/website-builder-sdk";
import { useGetPage } from "~/features/pages/index.js";
import { useGetWebsiteBuilderSettings } from "~/features/index.js";
import { Routes } from "~/routes.js";
import { PageEditorDrawerProvider } from "./Revisions/usePageEditorDrawer.js";
import { PageEditorSurface } from "./PageEditorSurface.js";
import { pageToEditorDocument } from "./pageDocument.js";
import { ExperimentsEditorPresenterFeature } from "~/presentation/experiments/ExperimentsEditor/index.js";
import { ExperimentsDrawerView } from "~/presentation/experiments/ExperimentsManager/index.js";

export const PageEditor = () => {
    const { getSettings } = useGetWebsiteBuilderSettings();
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState<EditorPage | null>(null);

    const [isRevisionListOpen, openRevisionList] = useState(false);

    const { route } = useRoute(Routes.Pages.Editor);

    const { getPage } = useGetPage();

    const { presenter } = useFeature(ExperimentsEditorPresenterFeature);

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

    // Initialize the experiments hub presenter with the page being edited; it owns the shared
    // selection state so the toolbar and editor surface can swap between the page and a variant.
    useEffect(() => {
        if (page) {
            presenter.init(page.id);
        }
    }, [presenter, page?.id]);

    if (loading || !page) {
        return <OverlayLoader text={"Loading page..."} />;
    }

    return (
        <PageEditorDrawerProvider
            openRevisionList={openRevisionList}
            isRevisionListOpen={isRevisionListOpen}
        >
            <PageEditorSurface page={page} />
            <ExperimentsDrawerView />
        </PageEditorDrawerProvider>
    );
};
