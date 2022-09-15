import * as React from "react";
import { ConnectDropTarget, useDrop } from "react-dnd";
import { FieldEditorDragSource } from "./FieldEditor/FieldEditorContext";

export interface DroppableChildrenFunctionParams {
    isDragging: boolean;
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
    (item: FieldEditorDragSource): void;
}
export interface DroppableProps {
    type?: string;
    children: DroppableChildrenFunction;
    isDragging?: boolean;
    isDroppable?: (item: any) => boolean;
    isVisible?: IsVisibleCallable;
    onDrop?: OnDropCallable;
}

const DroppableComponent: React.FC<DroppableProps> = props => {
    const { children, onDrop, isVisible = () => true } = props;

    const [{ item, isOver }, drop] = useDrop({
        accept: "element",
        collect: monitor => ({
            isOver: monitor.isOver() && monitor.isOver({ shallow: true }),
            item: monitor.getItem()
        }),
        drop(_, monitor) {
            if (typeof onDrop === "function") {
                return onDrop(monitor.getItem());
            }
        }
    });

    if (item && !isVisible(item)) {
        return null;
    }

    return children({ isDragging: Boolean(item), isOver, item, drop });
};

export const Droppable: React.FC<DroppableProps> = React.memo(DroppableComponent);
