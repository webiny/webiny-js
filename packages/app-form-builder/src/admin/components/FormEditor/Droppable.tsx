import * as React from "react";
import { ConnectDropTarget, DragObjectWithType, useDrop } from "react-dnd";
import { FbFormStep, FieldLayoutPositionType } from "~/types";

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
    ui: string;
    pos?: Partial<FieldLayoutPositionType>;
    formStep?: FbFormStep;
}
export interface IsVisibleCallable {
    (params: IsVisibleCallableParams): boolean;
}
/*
    We need to extend DragObjectWithType type because it does not support fields,
    that we set through "beginDrag".
    * "ui" propetry gives us information about the Entity that we are moving.
    "Entity" can be step, field, row or custom. "Entity" will be custom in case we are moving field from a "Custom Field" menu.
    * "name" property contains the type of the field, it can be text, number or one of the available fields.
    * "pos" propety contains info about Entity position that we are moving
    pos can be undefined in case we are moving field from a "Custom Field" menu.
*/
export interface DragObjectWithFieldInfo extends DragObjectWithType {
    ui: string;
    name: string;
    pos?: Partial<FieldLayoutPositionType>;
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

const DroppableComponent: React.FC<DroppableProps> = props => {
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

export const Droppable: React.FC<DroppableProps> = React.memo(DroppableComponent);
