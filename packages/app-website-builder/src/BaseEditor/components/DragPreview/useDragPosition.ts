import type { DragLayerMonitor } from "react-dnd";

let subscribedToOffsetChange = false;
let dragPreviewRef: HTMLDivElement | null = null;

const onOffsetChange = (monitor: DragLayerMonitor) => () => {
    if (!dragPreviewRef) {
        return;
    }

    const offset = monitor.getClientOffset();
    if (!offset) {
        return;
    }

    const transform = `translate(${offset.x + 8}px, ${offset.y + 8}px)`;
    dragPreviewRef.style["transform"] = transform;
    // @ts-expect-error
    dragPreviewRef.style["-webkit-transform"] = transform;
};

export function setupDragPosition(monitor: DragLayerMonitor) {
    if (!subscribedToOffsetChange) {
        // @ts-expect-error
        monitor.subscribeToOffsetChange(onOffsetChange(monitor));
        subscribedToOffsetChange = true;
    }
}

export function setDragPreviewRef(el: HTMLDivElement | null) {
    dragPreviewRef = el;
}

export function resetDragPosition() {
    subscribedToOffsetChange = false;
    dragPreviewRef = null;
}
