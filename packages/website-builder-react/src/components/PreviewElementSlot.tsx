"use client";
import React from "react";
import { LiveElementSlot } from "./LiveElementSlot";
import { useElementSlotDepth } from "./ElementSlotDepthProvider";

interface ElementSlotProps {
    // Element that contains this slot.
    parentId: string;
    // Path to the array of elements within the element's data structure.
    slot: string;
    // IDs of the elements to render.
    elements: string[];
}

export const PreviewElementSlot = ({ parentId, slot, elements = [] }: ElementSlotProps) => {
    const depth = useElementSlotDepth();

    if (!elements.length) {
        return (
            <div
                style={{ height: 100, width: "100% !important" }}
                data-role={"element-slot"}
                data-parent-id={parentId}
                data-parent-slot={slot}
                data-depth={depth}
                data-empty={true}
            />
        );
    }

    return <LiveElementSlot elements={elements} />;
};
