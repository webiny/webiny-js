import React, { useEffect, useState } from "react";
import type { DragLayerMonitor } from "react-dnd";
import { useDragLayer } from "react-dnd";
import { dropZoneState } from "~/BaseEditor/defaultConfig/Content/Preview/dropZoneState.js";
import { setupDragPosition, setDragPreviewRef, resetDragPosition } from "./useDragPosition.js";
import { DragCursorWrapper } from "./DragCursorWrapper.js";

const DragPreview = () => {
    const [opacity, setOpacity] = useState(0);
    const [isOverSlot, setIsOverSlot] = useState(false);

    const { isDragging, item } = useDragLayer((monitor: DragLayerMonitor) => {
        setupDragPosition(monitor);

        return {
            isDragging: monitor.isDragging(),
            item: monitor.getItem()
        };
    });

    useEffect(() => {
        return dropZoneState.subscribe(setIsOverSlot);
    }, []);

    useEffect(() => {
        return () => {
            resetDragPosition();
        };
    }, []);

    useEffect((): void => {
        if (isDragging) {
            setTimeout(() => {
                setOpacity(isDragging ? 1 : 0);
            }, 100);
            return;
        }

        setOpacity(0);
    }, [isDragging]);

    if (!isDragging) {
        return null;
    }

    if (item && item.dragInNavigator) {
        return null;
    }

    return (
        <div className="fixed pointer-events-none left-0 top-0 w-full h-full z-[1001]">
            <div
                ref={setDragPreviewRef}
                className="transition-opacity duration-250 ease-in-out absolute"
                style={{ opacity }}
            >
                <DragCursorWrapper componentName={item?.componentName} isOverSlot={isOverSlot} />
            </div>
        </div>
    );
};

export default DragPreview;
