import React, { useEffect, useState } from "react";
import type { DragLayerMonitor } from "react-dnd";
import { useDragLayer } from "react-dnd";
import { useDropZoneManager } from "~/BaseEditor/defaultConfig/Content/Preview/DropZoneManagerProvider.js";
import { setupDragPosition, setDragPreviewRef, resetDragPosition } from "./useDragPosition.js";
import { DragCursorWrapper } from "./DragCursorWrapper.js";

const DragPreview = () => {
    const [isOverSlot, setIsOverSlot] = useState(false);
    const dropZoneManager = useDropZoneManager();

    const { isDragging, item } = useDragLayer((monitor: DragLayerMonitor) => {
        setupDragPosition(monitor);

        return {
            isDragging: monitor.isDragging(),
            item: monitor.getItem()
        };
    });

    useEffect(() => {
        return dropZoneManager.subscribeToMatchChange(setIsOverSlot);
    }, [dropZoneManager]);

    useEffect(() => {
        return () => {
            resetDragPosition();
        };
    }, []);

    if (!isDragging) {
        return null;
    }

    if (item && item.dragInNavigator) {
        return null;
    }

    return (
        <div className="fixed pointer-events-none left-0 top-0 w-full h-full z-[1001]">
            <div ref={setDragPreviewRef} className="absolute">
                <DragCursorWrapper componentName={item?.componentName} isOverSlot={isOverSlot} />
            </div>
        </div>
    );
};

export default DragPreview;
