import React, { useEffect, useState } from "react";
import { useDragLayer } from "react-dnd";

const layerStyles = {
    position: "fixed",
    pointerEvents: "none",
    zIndex: 100,
    left: 0,
    top: 0,
    width: "100%",
    height: "100%"
};

let subscribedToOffsetChange = false;

let dragPreviewRef = null;

const onOffsetChange = monitor => () => {
    if (!dragPreviewRef) return;

    const offset = monitor.getClientOffset();
    if (!offset) return;

    const transform = `translate(${offset.x - 15}px, ${offset.y - 15}px)`;
    dragPreviewRef.style["transform"] = transform;
    dragPreviewRef.style["-webkit-transform"] = transform;
};

export default () => {
    const [dragHelperOpacity, setDragHelperOpacity] = useState(0);
    const { isDragging } = useDragLayer(monitor => {
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
        <div style={layerStyles}>
            <div
                ref={el => (dragPreviewRef = el)}
                style={{
                    transition: "opacity .25s ease-in-out",
                    display: "block",
                    opacity: dragHelperOpacity
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
