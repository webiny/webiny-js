"use client";
import React from "react";
import { ElementRenderer } from "./ElementRenderer";
import { ElementSlotProps } from "./ElementSlot";
import { ElementSlotDepthProvider, useElementSlotDepth } from "./ElementSlotDepthProvider";
import { ElementIndexProvider } from "./ElementIndexProvider";

export const LiveElementSlot = ({ elements = [] }: Pick<ElementSlotProps, "elements">) => {
    const depth = useElementSlotDepth();
    return (
        <>
            <ElementSlotDepthProvider depth={depth + 1}>
                {elements.map((id, index) => (
                    <ElementIndexProvider key={id} index={index}>
                        <ElementRenderer id={id} />
                    </ElementIndexProvider>
                ))}
            </ElementSlotDepthProvider>
        </>
    );
};
