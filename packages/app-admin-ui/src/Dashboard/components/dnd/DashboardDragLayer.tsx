import React from "react";
import { useDragLayer } from "react-dnd";
import type { XYCoord } from "react-dnd";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as DragIndicatorIcon } from "@webiny/icons/drag_indicator.svg";

interface DragItem {
    name: string;
}

interface DashboardDragLayerProps {
    titles: Map<string, { title: string }>;
}

/**
 * A custom drag preview that follows the cursor. The native HTML5 preview is suppressed
 * (see DashboardWidgetCard), so this chip is the only thing the user sees moving.
 */
export const DashboardDragLayer = ({ titles }: DashboardDragLayerProps) => {
    const { isDragging, item, offset } = useDragLayer(monitor => ({
        isDragging: monitor.isDragging(),
        item: monitor.getItem() as DragItem | null,
        offset: monitor.getClientOffset() as XYCoord | null
    }));

    if (!isDragging || !item || !offset) {
        return null;
    }

    const title = titles.get(item.name)?.title ?? item.name;

    return (
        <div className={"pointer-events-none fixed left-0 top-0 z-[9999]"}>
            <div
                style={{
                    transform: `translate(${offset.x + 12}px, ${offset.y + 12}px) rotate(1.5deg)`
                }}
                className={
                    "flex items-center gap-sm whitespace-nowrap rounded-lg border-sm " +
                    "border-neutral-dimmed bg-neutral-base px-sm-extra py-sm-plus text-md " +
                    "font-semibold text-neutral-primary shadow-lg"
                }
            >
                <Icon
                    icon={<DragIndicatorIcon />}
                    label={"Dragging"}
                    size={"sm"}
                    color={"neutral-light"}
                />
                {title}
            </div>
        </div>
    );
};
