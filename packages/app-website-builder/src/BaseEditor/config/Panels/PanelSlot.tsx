import React from "react";
import { CollapsibleSidePanel } from "@webiny/admin-ui";
import { CurrentPanelContext } from "./PanelsContext.js";
import type { PanelConfig } from "./types.js";
import type { PanelSide } from "./types.js";

export interface PanelSlotProps {
    panel: PanelConfig;
    side: PanelSide;
    open: boolean;
    onExpand(): void;
}

/**
 * One panel beside the canvas, open or collapsed to its rail. `CollapsibleSidePanel` draws it; this
 * adds what the editor needs around the panel's element.
 *
 * The panel is what the canvas makes room for (`data-affects-preview`), so the canvas follows its
 * width as it animates. The element's own `data-affects-preview` is nested inside and not counted
 * again.
 */
export const PanelSlot = ({ panel, side, open, onExpand }: PanelSlotProps) => {
    return (
        <CollapsibleSidePanel
            open={open}
            label={panel.label}
            side={side}
            onExpand={onExpand}
            data-panel={panel.name}
            data-affects-preview={"width"}
        >
            <CurrentPanelContext.Provider value={{ name: panel.name, label: panel.label, side }}>
                <wb-editor-ui-element data-name={panel.name} class={"contents"}>
                    {panel.element}
                </wb-editor-ui-element>
            </CurrentPanelContext.Provider>
        </CollapsibleSidePanel>
    );
};
