import React from "react";
import { useDragLayer } from "react-dnd";
import type { XYCoord } from "react-dnd";
import { Icon } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { ReactComponent as DragIndicatorIcon } from "@webiny/icons/drag_indicator.svg";

import type { DashboardWidgetDragItem } from "./dragItem.js";

interface DragLayerState {
    isDragging: boolean;
    item: DashboardWidgetDragItem | null;
    offset: XYCoord | null;
}

/**
 * A custom drag preview that follows the cursor. The native HTML5 preview is suppressed
 * (see DashboardWidgetCard), so this chip is the only thing the user sees moving.
 */
export const DashboardDragLayer = () => {
    const { isDragging, item, offset } = useDragLayer<
        DragLayerState,
        DashboardWidgetDragItem | null
    >(monitor => ({
        isDragging: monitor.isDragging(),
        item: monitor.getItem(),
        offset: monitor.getClientOffset()
    }));

    if (!isDragging || !item || !offset) {
        return null;
    }

    return (
        <div className={"pointer-events-none fixed left-0 top-0 z-[9999]"}>
            <div
                style={{
                    transform: `translate(${offset.x + 12}px, ${offset.y + 12}px)`
                }}
                className={cn(
                    "flex items-center gap-sm whitespace-nowrap rounded-lg border-sm",
                    "border-neutral-dimmed bg-neutral-base px-sm-extra py-sm-plus text-md",
                    "font-semibold text-neutral-primary shadow-lg"
                )}
            >
                <Icon
                    icon={<DragIndicatorIcon />}
                    label={"Dragging"}
                    size={"sm"}
                    color={"neutral-light"}
                />
                {item.title}
            </div>
        </div>
    );
};
