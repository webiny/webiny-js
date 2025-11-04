import React, { useEffect, useState } from "react";
import type { DragSourceMonitor } from "react-dnd";
import { useDragLayer } from "react-dnd";
import type { DragSourceMonitorImpl } from "~/types.js";

let subscribedToOffsetChange = false;

let dragPreviewRef: HTMLDivElement | null = null;

const onOffsetChange = (monitor: DragSourceMonitor) => () => {
    if (!dragPreviewRef) {
        return;
    }

    const offset = monitor.getClientOffset();
    if (!offset) {
        return;
    }

    const transform = `translate(${offset.x - 15}px, ${offset.y - 15}px)`;
    dragPreviewRef.style["transform"] = transform;
    // TODO @ts-refactor figure out better type
    // @ts-expect-error
    dragPreviewRef.style["-webkit-transform"] = transform;
};

const DragPreview = () => {
    const [dragHelperOpacity, setDragHelperOpacity] = useState(0);
    const { isDragging } = useDragLayer(initialMonitor => {
        /**
         * We must cast because TS is complaining. We know that casting as DragSourceMonitorImpl is ok.
         */
        const monitor = initialMonitor as unknown as DragSourceMonitorImpl;
        if (!subscribedToOffsetChange) {
            monitor.subscribeToOffsetChange(onOffsetChange(monitor));
            subscribedToOffsetChange = true;
        }

        return {
            isDragging: monitor.isDragging()
        };
    });

    useEffect(() => {
        return () => {
            subscribedToOffsetChange = false;
            dragPreviewRef = null;
        };
    }, []);

    // We track the value of "isDragging" and apply opacity=1 (after 100ms), when it switches to true.
    // Without this, the drag cursor would be shown in the top-left corner for a short amount of time, and then it
    // would be repositioned correctly. Definitely looks like a glitch. This also adds a nice little fade-in effect.
    useEffect(() => {
        if (isDragging) {
            setTimeout(() => {
                setDragHelperOpacity(isDragging ? 1 : 0);
            }, 100);
        } else {
            setDragHelperOpacity(0);
        }
    }, [isDragging]);

    if (!isDragging) {
        return null;
    }

    if (!isDragging) {
        return null;
    }

    return (
        <div
            style={{ zIndex: 1001 }}
            className="fixed pointer-events-none left-0 top-0 w-full h-full"
        >
            <div
                ref={el => (dragPreviewRef = el)}
                className="transition-opacity duration-250 ease-in-out block"
                style={{ opacity: dragHelperOpacity }}
            >
                <div className="size-lg rounded-full bg-primary" />
            </div>
        </div>
    );
};
export default DragPreview;
