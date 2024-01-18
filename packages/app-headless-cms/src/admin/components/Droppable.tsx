import * as React from "react";
import { ConnectDropTarget, useDrop } from "react-dnd";
import { DragSource } from "~/types";

export interface DroppableChildrenFunctionParams {
    isDragging: boolean;
    isDroppable: boolean;
    isOver: boolean;
    item: any;
    drop: ConnectDropTarget;
}
export interface DroppableChildrenFunction {
    (params: DroppableChildrenFunctionParams): React.ReactElement;
}

interface IsVisibleParams {
    type: "row" | "field" | "newField";
    item: any;
    isDragging: boolean;
}
export interface IsVisibleCallable {
    (params: IsVisibleParams): boolean;
}
export interface OnDropCallable {
    (item: DragSource): void;
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

    const [{ item, isOver }, drop] = useDrop<any, any, any>({
        accept: "element",
        collect: monitor => ({
            isOver: monitor.isOver() && monitor.isOver({ shallow: true }),
            item: monitor.getItem()
        }),
        drop(item, monitor) {
            if (typeof props.isDroppable === "function" && !props.isDroppable(item)) {
                return;
            }

            if (typeof onDrop === "function") {
                return onDrop(monitor.getItem());
            }
        }
    });

    if (item && !isVisible(item)) {
        return null;
    }

    let isDroppable = true;
    if (item) {
        isDroppable = props.isDroppable ? props.isDroppable(item) : isOver;
    }

    return children({ isDragging: Boolean(item), isOver, isDroppable, item, drop });
};

export const Droppable: React.ComponentType<DroppableProps> = React.memo(DroppableComponent);
