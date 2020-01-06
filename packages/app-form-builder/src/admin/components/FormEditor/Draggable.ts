import React from "react";
import { useDrag, DragPreviewImage } from "react-dnd";

const emptyImage = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

const Draggable = React.memo(props => {
    const { children, beginDrag, endDrag, target } = props;

    const [{ isDragging }, drag, preview] = useDrag({
        item: { type: "element", target },
        collect: monitor => ({
            isDragging: monitor.isDragging()
        }),
        begin() {
            if (beginDrag) {
                return beginDrag;
            }
        },
        end(item, monitor) {
            if (typeof endDrag === "function") {
                return endDrag(item, monitor);
            }
        }
    });

    return (
        <>
            <DragPreviewImage connect={preview} src={emptyImage} />
            {children({ isDragging, drag })}
        </>
    );
});

export default Draggable;
