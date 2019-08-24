import React from "react";
import { DragLayer } from "react-dnd";

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

export default DragLayer(monitor => {
    if (!subscribedToOffsetChange) {
        monitor.subscribeToOffsetChange(onOffsetChange(monitor));
        subscribedToOffsetChange = true;
    }

    return {
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        currentOffset: monitor.getClientOffset(),
        isDragging: monitor.isDragging()
    };
})(
    React.memo(({ isDragging }) => {
        if (!isDragging) {
            return null;
        }

        return (
            <div style={layerStyles}>
                <div style={{ display: "block" }} ref={el => (dragPreviewRef = el)}>
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
    })
);
