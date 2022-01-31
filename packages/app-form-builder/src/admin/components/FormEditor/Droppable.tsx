import * as React from "react";
import { ConnectDropTarget, DragObjectWithType, useDrop } from "react-dnd";

export type DroppableChildrenFunction = (params: {
    isDragging: boolean;
    isOver: boolean;
    item: any;
    drop: ConnectDropTarget;
}) => React.ReactElement;

export interface DroppableProps {
    type?: string;
    children: DroppableChildrenFunction;
    isDragging?: boolean;
    isDroppable?: (item: any) => boolean;
    isVisible?: (params: { type: string; item: any; isDragging: boolean }) => boolean;
    onDrop?: (item: DragObjectWithType) => void;
}

const Droppable: React.FC<DroppableProps> = props => {
    const { children, onDrop, isVisible = () => true } = props;

    const [{ item, isOver }, drop] = useDrop({
        accept: "element",
        collect: monitor => ({
            isOver: monitor.isOver() && monitor.isOver({ shallow: true }),
            item: monitor.getItem()
        }),
        drop(_, monitor) {
            if (typeof onDrop === "function") {
                onDrop(monitor.getItem());
            }
        }
    });

    if (item && !isVisible(item)) {
        return null;
    }

    return children({ isDragging: Boolean(item), isOver, item, drop });
};

const MemoizedDroppable: React.FC<DroppableProps> = React.memo(Droppable);

export default MemoizedDroppable;
