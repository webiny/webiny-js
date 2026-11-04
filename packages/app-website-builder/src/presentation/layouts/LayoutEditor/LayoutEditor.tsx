import React, { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent, useRoute } from "@webiny/app-admin";
import { OverlayLoader } from "@webiny/admin-ui";
import { DocumentEditor } from "~/DocumentEditor/DocumentEditor.js";
import { DefaultEditorConfig } from "~/BaseEditor/index.js";
import { Routes } from "~/routes.js";
import { LAYOUT_EDITOR_NAME } from "../constants.js";
import { DefaultLayoutEditorConfig } from "./DefaultLayoutEditorConfig.js";
import { LayoutEditorFeature } from "./feature.js";
import type { LayoutEditorDocument } from "./layoutDocument.js";
import { RevisionsDrawer } from "./Revisions/RevisionsDrawer.js";

/**
 * Edit a layout revision (the route's id). A published or locked revision opens read-only, like a
 * published page: create a new revision from it to change the layout.
 */
export const LayoutEditor = createReactiveComponent(() => {
    const { presenter } = useFeature(LayoutEditorFeature);
    const { route } = useRoute(Routes.Layouts.Editor);

    useEffect(() => {
        void presenter.load(route.params.id);
    }, [presenter, route.params.id]);

    const { error, document, readOnly } = presenter.vm;

    if (error) {
        return <OverlayLoader text={error} />;
    }

    if (!document) {
        return <OverlayLoader text={"Loading layout..."} />;
    }

    return (
        <DocumentEditor<LayoutEditorDocument>
            key={document.id}
            document={document}
            name={LAYOUT_EDITOR_NAME}
            readOnly={readOnly}
        >
            <DefaultEditorConfig />
            <DefaultLayoutEditorConfig />
            <RevisionsDrawer />
        </DocumentEditor>
    );
});
