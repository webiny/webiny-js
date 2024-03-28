import * as React from "react";
import { ConnectDropTarget, useDrop } from "react-dnd";
import { FieldLayoutPositionType, Container, DropTargetType, DragObjectWithType } from "~/types";

export type DroppableChildrenFunction = (params: {
    isDragging: boolean;
    isOver: boolean;
    item: any;
    drop: ConnectDropTarget;
}) => React.ReactElement;

export type DroppableDragObject = DragObjectWithType;

export interface DroppableDropResult {
    // TODO @ts-refactor delete and go up the tree
    [key: string]: any;
}
export interface DroppableCollectedProps {
    item: any;
    isOver: boolean;
}

export interface IsVisibleCallableParams {
    type: string;
    isDragging: boolean;
    ui: DropTargetType;
    id?: string;
    pos: FieldLayoutPositionType;
    container?: Container;
}
export interface IsVisibleCallable {
    (params: IsVisibleCallableParams): boolean;
}

// We need to extend DragObjectWithType type because it does not support fields,
// that we set through "beginDrag".
export interface DragObjectWithFieldInfo extends DragObjectWithType {
    ui: DropTargetType;
    name: string;
    id?: string;
    pos: FieldLayoutPositionType;
    container?: Container;
}
export interface OnDropCallable {
    (item: DragObjectWithFieldInfo): DroppableDropResult | undefined;
}
export interface DroppableProps {
    type?: string;
    children: DroppableChildrenFunction;
    isDragging?: boolean;
    isDroppable?: (item: any) => boolean;
    isVisible?: IsVisibleCallable;
    onDrop?: OnDropCallable;
}

const DroppableComponent = (props: DroppableProps) => {
    const { children, onDrop, isVisible = () => true } = props;

    const [{ item, isOver }, drop] = useDrop<
        DroppableDragObject,
        DroppableDropResult,
        DroppableCollectedProps
    >({
        accept: "element",
        collect: monitor => ({
            isOver: monitor.isOver() && monitor.isOver({ shallow: true }),
            item: monitor.getItem()
        }),
        drop(_, monitor) {
            if (typeof onDrop !== "function") {
                return undefined;
            }
            return onDrop(monitor.getItem());
        }
    });

    if (item && !isVisible(item)) {
        return null;
    }

    return children({ isDragging: Boolean(item), isOver, item, drop });
};

export const Droppable: React.ComponentType<DroppableProps> = React.memo(DroppableComponent);
