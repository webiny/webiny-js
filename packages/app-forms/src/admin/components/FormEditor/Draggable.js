import React, { useEffect } from "react";
import { DragSource } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";

const Draggable = React.memo(({ children, connectDragSource, connectDragPreview, isDragging }) => {
    useEffect(() => {
        if (connectDragPreview) {
            connectDragPreview(getEmptyImage(), {
                captureDraggingState: true
            });
        }
    }, []);

    return children({ isDragging, connectDragSource });
});

Draggable.displayName = "Draggable";

const itemSource = {
    beginDrag(props) {
        if (props.beginDrag) {
            return props.beginDrag;
        }
        return { ...props };
    },
    endDrag(props, monitor) {
        if (props.endDrag) {
            return props.endDrag(props, monitor);
        }
    }
};

const collect = (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging(),
    item: monitor.getItem()
});

export default DragSource("element", itemSource, collect)(Draggable);
