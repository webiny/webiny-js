import React, { ReactElement } from "react";
import { useDrag, DragPreviewImage, ConnectDragSource } from "react-dnd";
import { DragSourceMonitor } from "react-dnd/lib/interfaces/monitors";

const emptyImage = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

export type DraggableChildrenFunction = (params: {
    isDragging: boolean;
    drag: ConnectDragSource;
}) => ReactElement;

export interface DraggableProps {
    children: DraggableChildrenFunction;
    beginDrag?: (props: DraggableProps, monitor: DragSourceMonitor) => void;
    // TODO @ts-refactor figure type for item
    // @ts-ignore
    endDrag?: (item, monitor: DragSourceMonitor) => void;
    target?: string[];
}

const Draggable: React.FC<DraggableProps> = props => {
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

export default React.memo(Draggable);
