import React from "react";
import { compose, pure, lifecycle } from "recompose";
import { DragSource } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";

const Draggable = pure(({ children, connectDragSource, isDragging }) => {
    return children({ isDragging, connectDragSource });
});

const itemSource = {
    beginDrag(props, monitor) {
        if (props.beginDrag) {
            return props.beginDrag(props, monitor);
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
    isDragging: monitor.isDragging()
});

export default compose(
    DragSource("element", itemSource, collect),
    lifecycle({
        componentDidMount() {
            const { connectDragPreview } = this.props;
            if (connectDragPreview) {
                connectDragPreview(getEmptyImage(), {
                    captureDraggingState: true
                });
            }
        }
    })
)(Draggable);
