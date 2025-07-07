"use client";
import React from "react";
import { environment } from "@webiny/app-website-builder/sdk";
import { LiveElementSlot } from "./LiveElementSlot";
import { PreviewElementSlot } from "./PreviewElementSlot";

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

    if (isEditing) {
        return <PreviewElementSlot {...props} />;
    } else {
        return <LiveElementSlot {...props} />;
    }
};
