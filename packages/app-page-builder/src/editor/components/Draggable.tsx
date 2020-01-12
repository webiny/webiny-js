import React, { ReactElement } from "react";
import {
    useDrag,
    DragPreviewImage,
    ConnectDragSource,
    DragSourceMonitor,
    DragObjectWithType
} from "react-dnd";

const emptyImage = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

export type DraggableChildrenFunction = (params: {
    isDragging: boolean;
    drag: ConnectDragSource;
}) => ReactElement;

export type DraggableProps = {
    children: DraggableChildrenFunction;
    beginDrag(props: DraggableProps, monitor: DragSourceMonitor): any;
    endDrag(item: any, monitor: DragSourceMonitor): void;
    target: string[];
};

export type DraggableItem = DragObjectWithType & {
    target: string[];
};

const Draggable = React.memo((props: DraggableProps) => {
    const { children, beginDrag, endDrag, target } = props;

    const [{ isDragging }, drag, preview] = useDrag({
        item: { type: "element", target } as DraggableItem,
        collect: monitor => ({
            isDragging: monitor.isDragging()
        }),
        begin(monitor) {
            if (typeof beginDrag === "function") {
                return beginDrag(props, monitor);
            }
            return { ...props };
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
