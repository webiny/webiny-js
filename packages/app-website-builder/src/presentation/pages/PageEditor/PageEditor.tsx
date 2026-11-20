import React, { useEffect, useState } from "react";
import { createReactiveComponent, useRoute } from "@webiny/app-admin";
import { DocumentEditor } from "~/DocumentEditor/DocumentEditor.js";
import { OverlayLoader } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { DefaultPageEditorConfig } from "./DefaultPageEditorConfig.js";
import { DefaultEditorConfig } from "~/BaseEditor/index.js";
import { EDITOR_NAME } from "~/presentation/pages/PageEditor/constants.js";
import type { EditorPage } from "@webiny/website-builder-sdk";
import { Routes } from "~/routes.js";
import { WbPageStatus } from "~/constants.js";
import { RevisionListDrawer } from "./Revisions/RevisionListDrawer.js";
import { PageEditorDrawerProvider } from "./Revisions/usePageEditorDrawer.js";
import { GlobalComponentsLoader } from "./GlobalComponents/GlobalComponentsLoader.js";
import { PageLayoutLoader } from "./PageLayout/PageLayoutLoader.js";
import { PageEditorFeature } from "./feature.js";

export const PageEditor = createReactiveComponent(() => {
    const { presenter } = useFeature(PageEditorFeature);
    const [isRevisionListOpen, openRevisionList] = useState(false);

    const { route } = useRoute(Routes.Pages.Editor);

    useEffect(() => {
        void presenter.load(route.params.id);
    }, [presenter, route.params.id]);

    const { error, page } = presenter.vm;

    if (error) {
        return <OverlayLoader text={error} />;
    }

    if (!page) {
        return <OverlayLoader text={"Loading page..."} />;
    }

    // The page is opened with its global components and its layout composed in, so they render and select
    // like any other element. Global instances are kept out of undo history, and saved on their own (see
    // PageGlobalComponentSaveBar); the page saves only its overrides of them (see PageAutoSave).
    return (
        <PageEditorDrawerProvider
            openRevisionList={openRevisionList}
            isRevisionListOpen={isRevisionListOpen}
        >
            <DocumentEditor<EditorPage>
                key={page.id}
                document={page}
                name={EDITOR_NAME}
                readOnly={page.status !== WbPageStatus.Draft}
            >
                <DefaultEditorConfig />
                <DefaultPageEditorConfig />
                <GlobalComponentsLoader />
                <PageLayoutLoader />

                <RevisionListDrawer page={page} />
            </DocumentEditor>
        </PageEditorDrawerProvider>
    );
});
