// @flow
import * as React from "react";
import { useDrop } from "react-dnd";

const Droppable = React.memo(props => {
    let { children, onDrop, isVisible = () => true } = props;

    const [{ item, isOver }, drop] = useDrop({
        accept: "element",
        collect: monitor => ({
            isOver: monitor.isOver() && monitor.isOver({ shallow: true }),
            item: monitor.getItem()
        }),
        drop(item, monitor) {
            if (typeof onDrop === "function") {
                onDrop(monitor.getItem());
            }
        }
    });

    if (item && !isVisible(item)) {
        return null;
    }

    // $FlowFixMe
    return children({ isDragging: Boolean(item), isOver, item, drop });
});

export default Droppable;
