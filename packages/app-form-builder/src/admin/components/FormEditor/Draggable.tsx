import React, { ReactElement } from "react";
import { useDrag, DragPreviewImage, ConnectDragSource } from "react-dnd";
import { DragSourceMonitor } from "react-dnd/lib/interfaces/monitors";
import { DragObjectWithType } from "react-dnd/lib/interfaces/hooksApi";

const emptyImage = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

export type DraggableChildrenFunction = (params: {
    isDragging: boolean;
    drag: ConnectDragSource;
}) => ReactElement;

interface BeginDragProps {
    ui?: "row" | "field";
    pos?: {
        row: number;
        index?: number;
    };
    name?: string;
}

type BeginDrag = (props: BeginDragProps, monitor: DragSourceMonitor) => void;
type EndDrag = (item: DragObjectWithType, monitor: DragSourceMonitor) => void;

export interface DraggableProps extends BeginDragProps {
    children: DraggableChildrenFunction;
    beginDrag?: BeginDrag | BeginDragProps;
    endDrag?: EndDrag;
    target?: string[];
}

const Draggable: React.FC<DraggableProps> = props => {
    const { children, beginDrag, endDrag, target } = props;

    const [{ isDragging }, drag, preview] = useDrag({
        item: {
            type: "element",
            /**
             * TODO @ts-refactor
             * There is no target on item in types.
             */
            // @ts-ignore
            target
        },
        collect: monitor => ({
            isDragging: monitor.isDragging()
        }),
        begin(monitor) {
            if (typeof beginDrag !== "function") {
                return beginDrag as undefined;
            }
            return beginDrag(props, monitor);
        },
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
