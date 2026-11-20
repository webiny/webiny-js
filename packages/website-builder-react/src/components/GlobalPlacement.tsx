"use client";
import React from "react";
import { observer } from "mobx-react-lite";
import { type DocumentElement, environment, GlobalElementId } from "@webiny/website-builder-sdk";
import { EditingElementRenderer } from "./EditingElementRenderer/EditingElementRenderer.js";
import { LiveElementRenderer } from "./LiveElementRenderer.js";
import { useDocumentStore } from "./DocumentStoreProvider.js";
import { PageScope, useIsReadOnlyScope } from "./PageLayout.js";

interface GlobalPlacementProps {
    placement: DocumentElement;
}

const PlacedInstance = observer(({ placement }: GlobalPlacementProps) => {
    const documentStore = useDocumentStore();
    const readOnly = useIsReadOnlyScope();
    const instance = documentStore.getElement(
        GlobalElementId.fromName(placement.component.name).toString()
    );

    if (!instance) {
        return null;
    }

    // In the editor, the placement is what's selected, moved and deleted; it shows the instance's values.
    if (environment.isEditing() && !readOnly) {
        return <EditingElementRenderer element={placement} instance={instance} />;
    }

    return <LiveElementRenderer element={instance} />;
});

/**
 * Render a placement of a global component: the global's single instance, at the placement's place.
 * In a layout rendered around a page, the instance comes with the page.
 */
export const GlobalPlacement = ({ placement }: GlobalPlacementProps) => {
    return (
        <PageScope>
            <PlacedInstance placement={placement} />
        </PageScope>
    );
};
