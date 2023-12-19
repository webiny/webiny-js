import React, { ReactElement } from "react";
import { useDrag, DragPreviewImage, ConnectDragSource } from "react-dnd";

const emptyImage = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

interface DraggableChildrenFunctionParams {
    isDragging: boolean;
    drag: ConnectDragSource;
}
export interface DraggableChildrenFunction {
    (params: DraggableChildrenFunctionParams): ReactElement;
}

export interface DraggableProps {
    children: DraggableChildrenFunction;
    beginDrag?: any;
    endDrag?: any;
    target?: string[];
}

const Draggable = (props: DraggableProps) => {
    const { children, beginDrag, endDrag, target } = props;

    const [{ isDragging }, drag, preview] = useDrag({
        item: { type: "element", target },
        collect: monitor => ({
            isDragging: monitor.isDragging()
        }),
        begin(monitor) {
            if (typeof beginDrag === "function") {
                return beginDrag(props, monitor);
            }
            return beginDrag;
        },
        end(item, monitor) {
            if (typeof endDrag === "function") {
                return endDrag(item, monitor);
            }
            return endDrag;
        }
    });

    return (
        <>
            <DragPreviewImage connect={preview} src={emptyImage} />
            {children({ isDragging, drag })}
        </>
    );
};

const MemoizedDraggable: React.ComponentType<DraggableProps> = React.memo(Draggable);
export default MemoizedDraggable;
