import { DropTarget } from "react-dnd";

const Droppable = ({ children, connectDropTarget, item, isOver, isVisible = () => true }) => {
    if (item && !isVisible(item)) {
        return null;
    }
    return connectDropTarget(children({ isDragging: Boolean(item), isOver, item }));
};
// Dragging
const spec = {
    drop(props, monitor) {
        props.onDrop(monitor.getItem());
    }
};

const props = (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver() && monitor.isOver({ shallow: true }),
    item: monitor.getItem()
});

export default DropTarget("element", spec, props)(Droppable);
