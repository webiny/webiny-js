import React, { useEffect, useRef, useState } from "react";
import type { DragLayerMonitor } from "react-dnd";
import { useDragLayer } from "react-dnd";
import { DragCursor } from "@webiny/admin-ui";
import { dropZoneOverState } from "./dropZoneOverState.js";
import { getDragInfo } from "./getDragInfo.js";
import type { DragSource } from "~/types.js";

let dragPreviewRef: HTMLDivElement | null = null;

const DragPreview = () => {
    const [opacity, setOpacity] = useState(0);
    const [isOverSlot, setIsOverSlot] = useState(false);
    const monitorRef = useRef<DragLayerMonitor | null>(null);

    const { isDragging, item } = useDragLayer((monitor: DragLayerMonitor) => {
        monitorRef.current = monitor;

        const offset = monitor.getClientOffset();
        if (offset && dragPreviewRef) {
            dragPreviewRef.style.transform = `translate(${offset.x + 12}px, ${offset.y + 12}px)`;
        }

        return {
            isDragging: monitor.isDragging(),
            item: monitor.getItem() as DragSource | null
        };
    });

    useEffect(() => {
        if (isDragging) {
            const t = setTimeout(() => setOpacity(1), 80);
            return () => clearTimeout(t);
        }
        setOpacity(0);
        return undefined;
    }, [isDragging]);

    useEffect(() => {
        return dropZoneOverState.subscribe(setIsOverSlot);
    }, []);

    useEffect(() => {
        return () => {
            dragPreviewRef = null;
        };
    }, []);

    if (!isDragging) {
        return null;
    }

    const { label, icon } = getDragInfo(item);

    return (
        <div className={"fixed pointer-events-none left-0 top-0 w-full h-full z-[1001]"}>
            <div
                ref={el => {
                    dragPreviewRef = el;
                }}
                className={"absolute transition-opacity duration-100"}
                style={{ opacity }}
            >
                <DragCursor label={label} icon={icon} isOverSlot={isOverSlot} />
            </div>
        </div>
    );
};

export default DragPreview;
