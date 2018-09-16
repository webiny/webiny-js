import React from "react";
import { DragSource } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";

class Draggable extends React.Component {
    componentDidMount() {
        const { connectDragPreview } = this.props;
        if (connectDragPreview) {
            connectDragPreview(getEmptyImage(), {
                captureDraggingState: true
            });
        }
    }

    render() {
        const { children, connectDragSource, isDragging } = this.props;
        return children({ isDragging, connectDragSource });
    }
}

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

export default DragSource("element", itemSource, collect)(Draggable);
