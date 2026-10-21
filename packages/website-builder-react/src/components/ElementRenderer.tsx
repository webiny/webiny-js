"use client";
import React from "react";
import { observer } from "mobx-react-lite";
import { contentSdk, environment, GlobalElementId } from "@webiny/website-builder-sdk";
import { EditingElementRenderer } from "./EditingElementRenderer/EditingElementRenderer.js";
import { LiveElementRenderer } from "./LiveElementRenderer.js";
import { useDocumentStore } from "./DocumentStoreProvider.js";
import { PageScope, useIsReadOnlyScope, usePageLayout } from "./PageLayout.js";
import { GlobalPlacement } from "./GlobalPlacement.js";

interface ElementRendererProps {
    id: string;
}

export const ElementRenderer = observer((props: ElementRendererProps) => {
    const documentStore = useDocumentStore();
    const pageLayout = usePageLayout();
    const readOnly = useIsReadOnlyScope();
    const isEditing = environment.isEditing() && !readOnly;

    // A global's instance comes with the page, also when a layout renders it.
    if (pageLayout && GlobalElementId.isGlobal(props.id)) {
        return (
            <PageScope>
                <ElementRenderer id={props.id} />
            </PageScope>
        );
    }

    const element = documentStore.getElement(props.id);

    if (!element) {
        return null;
    }

    if (GlobalElementId.isPlacement(element, contentSdk.getComponentManifests())) {
        return <GlobalPlacement placement={element} />;
    }

    // A layout's root only holds the page: on the page, there's nothing to select. Its content areas can
    // be selected, like the layout's other elements, to show where each of the page's areas sits.
    const isLayoutRoot = pageLayout && props.id === "root";

    if (isEditing && !isLayoutRoot) {
        return <EditingElementRenderer element={element} />;
    } else {
        return <LiveElementRenderer element={element} />;
    }
});
