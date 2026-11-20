import React from "react";
import { useEffect } from "react";
import { useLayoutEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { cn } from "@webiny/admin-ui";
import { CollapsedPanel } from "./CollapsedPanel.js";
import { CurrentPanelContext } from "./PanelsContext.js";
import type { PanelConfig } from "./types.js";
import type { PanelSide } from "./types.js";

/** The collapsed strip's width. */
const COLLAPSED_WIDTH = 45;

export interface PanelSlotProps {
    panel: PanelConfig;
    side: PanelSide;
    open: boolean;
    /** Bumped when this panel's toggle is pressed: focus moves to the button that replaces it. */
    toggleCount: number;
    onExpand(): void;
}

/**
 * One panel, open or collapsed, animated between the two the way the content model editor's
 * "Fields" sidebar is: the width slides between the content's own width and the strip's, and the
 * content and the strip cross-fade. The content stays mounted while collapsed, so it keeps its state
 * (an AI chat, a scroll position); `inert` keeps it out of the tab order and away from the pointer.
 *
 * This wrapper is what the canvas makes room for (`data-affects-preview`), so it shrinks with the
 * animation. The content's own `data-affects-preview` is nested inside it and not counted again.
 */
export const PanelSlot = ({ panel, side, open, toggleCount, onExpand }: PanelSlotProps) => {
    const slotRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentWidth, setContentWidth] = useState<number | null>(null);

    // The content sizes itself (`w-max`); the slot animates to whatever that is.
    useLayoutEffect(() => {
        const content = contentRef.current;
        if (!content) {
            return;
        }
        const measure = () => setContentWidth(content.offsetWidth);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(content);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (toggleCount === 0) {
            return;
        }
        const slot = slotRef.current;
        if (!open) {
            slot?.querySelector<HTMLElement>("[data-panel-expand]")?.focus();
            return;
        }
        // A panel without `PanelHeader` (the AI assistant has its own header): its first button.
        const collapse = slot?.querySelector<HTMLElement>("[data-panel-collapse]");
        const first = contentRef.current?.querySelector<HTMLElement>("button:not([disabled])");
        (collapse ?? first)?.focus();
    }, [toggleCount]);

    let width: number | undefined = COLLAPSED_WIDTH;
    if (open) {
        // Unmeasured on the first render: the content's own width, without an animation.
        width = contentWidth ?? undefined;
    }

    return (
        <div
            ref={slotRef}
            data-panel={panel.name}
            data-affects-preview={"width"}
            className={
                "relative flex-none overflow-hidden transition-[width] duration-200 ease-in-out"
            }
            style={{ width }}
        >
            <div
                ref={contentRef}
                inert={!open}
                className={cn(
                    "absolute inset-y-0 w-max transition-opacity duration-150",
                    // Pinned to the window's edge, so the slot closes from the canvas side.
                    side === "left" ? "left-0" : "right-0",
                    open ? "opacity-100 delay-75" : "pointer-events-none opacity-0"
                )}
            >
                <CurrentPanelContext.Provider
                    value={{ name: panel.name, label: panel.label, side }}
                >
                    <wb-editor-ui-element data-name={panel.name} class={"contents"}>
                        {panel.element}
                    </wb-editor-ui-element>
                </CurrentPanelContext.Provider>
            </div>
            <div
                inert={open}
                className={cn(
                    "absolute inset-0 flex transition-opacity duration-150",
                    side === "left" ? "justify-start" : "justify-end",
                    open ? "pointer-events-none opacity-0" : "opacity-100 delay-75"
                )}
            >
                <CollapsedPanel label={panel.label} side={side} onExpand={onExpand} />
            </div>
        </div>
    );
};
