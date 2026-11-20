"use client";
import React from "react";
import { LiveElementSlot } from "./LiveElementSlot.js";
import { useElementSlotDepth } from "./ElementSlotDepthProvider.js";
import { useSlotLabel } from "./SlotLabel.js";

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
    const label = useSlotLabel(parentId, slot);

    if (!elements.length) {
        return (
            <div
                style={{ height: 100, width: "100% !important" }}
                data-role={"element-slot"}
                data-parent-id={parentId}
                data-parent-slot={slot}
                data-depth={depth}
                data-empty={true}
            >
                {label ? (
                    <span
                        style={{
                            display: "block",
                            padding: 8,
                            fontSize: 12,
                            lineHeight: "16px",
                            color: "#6b6b6b"
                        }}
                    >
                        {label}
                    </span>
                ) : null}
            </div>
        );
    }

    return <LiveElementSlot elements={elements} />;
};
