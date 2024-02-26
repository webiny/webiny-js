import React, { useEffect, useState } from "react";
import { DragLayerMonitor, useDragLayer } from "react-dnd";

const layerStyles: React.CSSProperties = {
    position: "fixed",
    pointerEvents: "none",
    zIndex: 100,
    left: 0,
    top: 0,
    width: "100%",
    height: "100%"
};

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

    const transform = `translate(${offset.x - 15}px, ${offset.y - 15}px)`;
    dragPreviewRef.style["transform"] = transform;
    /**
     * TS is complaining about -webkit.
     */
    // @ts-expect-error
    dragPreviewRef.style["-webkit-transform"] = transform;
};

const DragPreview = () => {
    const [dragHelperOpacity, setDragHelperOpacity] = useState(0);

    const { isDragging, item } = useDragLayer((monitor: DragLayerMonitor) => {
        if (!subscribedToOffsetChange) {
            // @ts-expect-error
            monitor.subscribeToOffsetChange(onOffsetChange(monitor));
            subscribedToOffsetChange = true;
        }

        return {
            isDragging: monitor.isDragging(),
            item: monitor.getItem()
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
    useEffect((): void => {
        if (isDragging) {
            setTimeout(() => {
                setDragHelperOpacity(isDragging ? 1 : 0);
            }, 100);
            return;
        }

        setDragHelperOpacity(0);
    }, [isDragging]);

    if (!isDragging) {
        return null;
    }
    // We don't want to show the drag preview for items being drag in the navigator.
    if (item && item.dragInNavigator) {
        return null;
    }

    return (
        <div style={layerStyles}>
            <div
                ref={el => (dragPreviewRef = el)}
                style={{
                    display: "block",
                    opacity: dragHelperOpacity,
                    transition: "opacity .25s ease-in-out"
                }}
            >
                <div
                    style={{
                        width: 30,
                        height: 30,
                        backgroundColor: "var(--mdc-theme-primary)",
                        borderRadius: "50%"
                    }}
                />
            </div>
        </div>
    );
};

export default DragPreview;
