"use client";
import React from "react";
import { environment } from "@webiny/website-builder-sdk";
import { LiveElementSlot } from "./LiveElementSlot.js";
import { PreviewElementSlot } from "./PreviewElementSlot.js";
import { useIsReadOnlyScope, usePageLayout } from "./PageLayout.js";

export interface ElementSlotProps {
    // Element that contains this slot.
    parentId: string;
    // Path to the array of elements within the element's data structure.
    slot: string;
    // IDs of the elements to render.
    elements: string[];
}

export const ElementSlot = (props: ElementSlotProps) => {
    const isEditing = environment.isEditing();
    const pageLayout = usePageLayout();
    const readOnly = useIsReadOnlyScope();

    // The slots of a page's layout list the layout's elements: an element dropped there from the page editor
    // would belong to the page, with nowhere to be stored. A page adds its content to the layout's page
    // content areas, which render the page's own slots (see `LayoutContent`).
    if (isEditing && !pageLayout && !readOnly) {
        return <PreviewElementSlot {...props} />;
    } else {
        return <LiveElementSlot {...props} />;
    }
};
