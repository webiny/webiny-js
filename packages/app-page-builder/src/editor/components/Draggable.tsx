import React from "react";
import { useDrag, DragPreviewImage, ConnectDragSource, DragSourceMonitor } from "react-dnd";
import { DragObjectWithType } from "~/types";

const emptyImage = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

interface DraggableChildrenFunctionParams {
    isDragging: boolean;
    drag: ConnectDragSource | null;
}
export interface DraggableChildrenFunction {
    (params: DraggableChildrenFunctionParams): React.ReactElement;
}

export interface DraggableProps {
    children: DraggableChildrenFunction;
    beginDrag(props: DraggableProps, monitor: DragSourceMonitor): any;
    endDrag(item: any, monitor: DragSourceMonitor): void;
    target?: string[];
    enabled: boolean;
}

export interface DraggableItem extends DragObjectWithType {
    target?: string[];
}

const Draggable = (props: DraggableProps) => {
    const { children, beginDrag, endDrag, enabled = true } = props;

    const [{ isDragging }, drag, preview] = useDrag({
        type: "element",
        item(monitor) {
            if (typeof beginDrag === "function") {
                return beginDrag(props, monitor);
            }
            return { ...props };
        },
        collect: monitor => ({
            isDragging: monitor.isDragging()
        }),
        end(item, monitor) {
            if (typeof endDrag === "function") {
                return endDrag(item, monitor);
            }
        }
    });

    if (!enabled) {
        return children({ isDragging: false, drag: null });
    }

    return (
        <>
            <DragPreviewImage connect={preview} src={emptyImage} />
            {children({ isDragging, drag })}
        </>
    );
};

export default React.memo(Draggable);
