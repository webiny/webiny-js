import React, { ReactElement } from "react";
import { Container, DragObjectWithType } from "~/types";
import { useDrag, DragPreviewImage, ConnectDragSource, DragSourceMonitor } from "react-dnd";

const emptyImage = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

export type DraggableChildrenFunction = (params: {
    isDragging: boolean;
    drag: ConnectDragSource;
}) => ReactElement;

export interface BeginDragProps {
    ui?: "row" | "field" | "step";
    pos?: {
        row: number;
        index?: number;
    };
    name?: string;
    id?: string;
    // "container" contains info about source element.
    container?: Container;
}

export type BeginDrag = (props: BeginDragProps, monitor: DragSourceMonitor) => void;
export type EndDrag = (item: DragObjectWithType, monitor: DragSourceMonitor) => void;

export interface DraggableProps extends BeginDragProps {
    children: DraggableChildrenFunction;
    beginDrag?: BeginDrag | BeginDragProps;
    endDrag?: EndDrag;
    target?: string[];
}

const Draggable = (props: DraggableProps) => {
    const { children, beginDrag, endDrag } = props;

    const [{ isDragging }, drag, preview] = useDrag({
        type: "element",
        item(monitor) {
            if (typeof beginDrag !== "function") {
                return beginDrag as undefined;
            }
            return beginDrag(props, monitor);
        },
        collect: monitor => ({
            isDragging: monitor.isDragging()
        }),
        end(item, monitor) {
            if (typeof endDrag !== "function") {
                return endDrag as undefined;
            }
            return endDrag(item as unknown as DragObjectWithType, monitor);
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
